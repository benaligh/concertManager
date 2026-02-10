<?php

namespace App\Controller\Api;

use App\Entity\Group;
use App\Exception\BusinessException;
use App\Exception\NotFoundException;
use App\Service\GroupImportService;
use App\Service\GroupService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/groups', name: 'api_groups_')]
class GroupController extends AbstractController
{
    public function __construct(
        private GroupService $groupService,
        private GroupImportService $groupImportService,
        private SerializerInterface $serializer
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            // Récupération des filtres
            $filters = [
                'name' => $request->query->get('name'),
                'city' => $request->query->get('city'),
                'musicalStyle' => $request->query->get('musicalStyle'),
                'startYear' => $request->query->get('startYear') ? (int) $request->query->get('startYear') : null,
            ];
            $filters = array_filter($filters, fn($value) => $value !== null && $value !== '');

            // Pagination
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));

            $result = $this->groupService->findAll($filters, $page, $limit);

            // Convertir les entités en tableaux
            $items = array_map(fn($group) => $this->groupToArray($group), $result['items']);

            $data = [
                'success' => true,
                'data' => $items,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $result['total'],
                    'pages' => ceil($result['total'] / $limit)
                ]
            ];

            return $this->json($data, Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        try {
            $group = $this->groupService->find($id);
            return $this->json([
                'success' => true,
                'data' => $this->groupToArray($group)
            ], Response::HTTP_OK);
        } catch (NotFoundException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return $this->json([
                    'success' => false,
                    'message' => 'JSON invalide'
                ], Response::HTTP_BAD_REQUEST);
            }

            $group = $this->groupService->create($data);

            return $this->json([
                'success' => true,
                'data' => $this->groupToArray($group),
                'message' => 'Groupe créé avec succès'
            ], Response::HTTP_CREATED);
        } catch (BusinessException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return $this->json([
                    'success' => false,
                    'message' => 'JSON invalide'
                ], Response::HTTP_BAD_REQUEST);
            }

            $group = $this->groupService->update($id, $data);

            return $this->json([
                'success' => true,
                'data' => $this->groupToArray($group),
                'message' => 'Groupe mis à jour avec succès'
            ], Response::HTTP_OK);
        } catch (NotFoundException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_NOT_FOUND);
        } catch (BusinessException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $this->groupService->delete($id);

            return $this->json([
                'success' => true,
                'message' => 'Groupe supprimé avec succès'
            ], Response::HTTP_OK);
        } catch (NotFoundException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/import', name: 'import', methods: ['POST'])]
    public function import(Request $request): JsonResponse
    {
        try {
            // Vérifier qu'un fichier a été uploadé
            $file = $request->files->get('file');
            
            if (!$file) {
                return $this->json([
                    'success' => false,
                    'message' => 'Aucun fichier n\'a été fourni'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Vérifier le type de fichier
            if (!in_array($file->getMimeType(), [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
                'application/octet-stream' // Fallback pour certains navigateurs
            ])) {
                return $this->json([
                    'success' => false,
                    'message' => 'Le fichier doit être un fichier Excel (.xlsx ou .xls)'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Vérifier la taille du fichier (max 10MB)
            if ($file->getSize() > 10 * 1024 * 1024) {
                return $this->json([
                    'success' => false,
                    'message' => 'Le fichier est trop volumineux (maximum 10MB)'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Déplacer le fichier vers un répertoire temporaire
            $uploadDir = sys_get_temp_dir();
            // Déterminer l'extension à partir du nom du fichier ou du type MIME
            $extension = pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION);
            if (empty($extension)) {
                $extension = strpos($file->getMimeType(), 'spreadsheetml') !== false ? 'xlsx' : 'xls';
            }
            $fileName = uniqid('group_import_', true) . '.' . $extension;
            $filePath = $uploadDir . '/' . $fileName;
            
            try {
                $file->move($uploadDir, $fileName);
                
                // Importer les groupes
                $result = $this->groupImportService->importFromFile($filePath);
                
                // Supprimer le fichier temporaire
                @unlink($filePath);
                
                return $this->json([
                    'success' => true,
                    'message' => "Import terminé: {$result['success']} groupe(s) créé(s) sur {$result['total']}",
                    'data' => [
                        'success' => $result['success'],
                        'total' => $result['total'],
                        'errors' => $result['errors']
                    ]
                ], Response::HTTP_OK);
                
            } catch (BusinessException $e) {
                // Supprimer le fichier temporaire en cas d'erreur
                @unlink($filePath);
                
                return $this->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], Response::HTTP_BAD_REQUEST);
            } catch (\Exception $e) {
                // Supprimer le fichier temporaire en cas d'erreur
                @unlink($filePath);
                
                return $this->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'import: ' . $e->getMessage()
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
            
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de l\'import: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/count', name: 'count', methods: ['GET'])]
    public function count(): JsonResponse
    {
        try {
            $count = $this->groupService->count();
            return $this->json([
                'success' => true,
                'data' => [
                    'total' => $count
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Convertit une entité Group en tableau pour la sérialisation JSON
     */
    private function groupToArray(Group $group): array
    {
        return [
            'id' => $group->getId(),
            'name' => $group->getName(),
            'origin' => $group->getOrigin(),
            'city' => $group->getCity(),
            'startYear' => $group->getStartYear(),
            'endYear' => $group->getEndYear(),
            'founders' => $group->getFounders(),
            'membersCount' => $group->getMembersCount(),
            'musicalStyle' => $group->getMusicalStyle(),
            'presentation' => $group->getPresentation(),
            'createdAt' => $group->getCreatedAt()?->format('Y-m-d\TH:i:sP')
        ];
    }
}

