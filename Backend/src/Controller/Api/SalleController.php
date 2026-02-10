<?php

namespace App\Controller\Api;

use App\Entity\Salle;
use App\Exception\BusinessException;
use App\Exception\NotFoundException;
use App\Service\SalleImportService;
use App\Service\SalleService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/salles', name: 'api_salles_')]
class SalleController extends AbstractController
{
    public function __construct(
        private SalleService $salleService,
        private SalleImportService $salleImportService
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            // Récupération des filtres
            $filters = [
                'city' => $request->query->get('city'),
                'minCapacity' => $request->query->get('minCapacity') ? (int) $request->query->get('minCapacity') : null,
            ];
            $filters = array_filter($filters, fn($value) => $value !== null && $value !== '');

            // Pagination
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));

            $result = $this->salleService->findAll($filters, $page, $limit);

            // Convertir les entités en tableaux
            $items = array_map(fn($salle) => $this->salleToArray($salle), $result['items']);

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
            $salle = $this->salleService->find($id);
            return $this->json([
                'success' => true,
                'data' => $this->salleToArray($salle)
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

            $salle = $this->salleService->create($data);

            return $this->json([
                'success' => true,
                'data' => $this->salleToArray($salle),
                'message' => 'Salle créée avec succès'
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

            $salle = $this->salleService->update($id, $data);

            return $this->json([
                'success' => true,
                'data' => $this->salleToArray($salle),
                'message' => 'Salle mise à jour avec succès'
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
            $this->salleService->delete($id);

            return $this->json([
                'success' => true,
                'message' => 'Salle supprimée avec succès'
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
            $fileName = uniqid('salle_import_', true) . '.' . $extension;
            $filePath = $uploadDir . '/' . $fileName;
            
            try {
                $file->move($uploadDir, $fileName);
                
                // Importer les salles
                $result = $this->salleImportService->importFromFile($filePath);
                
                // Supprimer le fichier temporaire
                @unlink($filePath);
                
                return $this->json([
                    'success' => true,
                    'message' => "Import terminé: {$result['success']} salle(s) créée(s) sur {$result['total']}",
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
            $count = $this->salleService->count();
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
     * Convertit une entité Salle en tableau pour la sérialisation JSON
     */
    private function salleToArray(Salle $salle): array
    {
        return [
            'id' => $salle->getId(),
            'name' => $salle->getName(),
            'city' => $salle->getCity(),
            'capacity' => $salle->getCapacity(),
            'address' => $salle->getAddress()
        ];
    }
}

