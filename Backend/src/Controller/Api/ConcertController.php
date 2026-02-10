<?php

namespace App\Controller\Api;

use App\Entity\Concert;
use App\Exception\BusinessException;
use App\Exception\NotFoundException;
use App\Service\ConcertService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/concerts', name: 'api_concerts_')]
class ConcertController extends AbstractController
{
    public function __construct(
        private ConcertService $concertService
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            // Récupération des filtres
            $filters = [
                'status' => $request->query->get('status'),
                'date' => $request->query->get('date'),
                'salleId' => $request->query->get('salleId') ? (int) $request->query->get('salleId') : null,
                'groupId' => $request->query->get('groupId') ? (int) $request->query->get('groupId') : null,
            ];
            $filters = array_filter($filters, fn($value) => $value !== null && $value !== '');

            // Pagination
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));

            $result = $this->concertService->findAll($filters, $page, $limit);

            // Convertir les entités en tableaux
            $items = array_map(fn($concert) => $this->concertToArray($concert), $result['items']);

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
            $concert = $this->concertService->find($id);
            return $this->json([
                'success' => true,
                'data' => $this->concertToArray($concert)
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
                    'message' => 'JSON invalide: ' . json_last_error_msg()
                ], Response::HTTP_BAD_REQUEST);
            }

            // Vérifier que les données requises sont présentes
            if (empty($data)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Aucune donnée fournie'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Logger les données reçues pour le débogage
            error_log('=== CONCERT CREATE REQUEST ===');
            error_log('Request data: ' . json_encode($data, JSON_PRETTY_PRINT));
            error_log('Request headers: ' . json_encode($request->headers->all(), JSON_PRETTY_PRINT));
            error_log('Request method: ' . $request->getMethod());
            error_log('Request content: ' . $request->getContent());

            $concert = $this->concertService->create($data);
            
            // Logger le succès
            error_log('Concert created successfully with ID: ' . $concert->getId());
            error_log('=== END CONCERT CREATE ===');

            return $this->json([
                'success' => true,
                'data' => $this->concertToArray($concert),
                'message' => 'Concert créé avec succès'
            ], Response::HTTP_CREATED);
        } catch (BusinessException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            // Logger l'erreur complète pour le débogage
            error_log('Error creating concert: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la création du concert: ' . $e->getMessage()
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

            $concert = $this->concertService->update($id, $data);

            return $this->json([
                'success' => true,
                'data' => $this->concertToArray($concert),
                'message' => 'Concert mis à jour avec succès'
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
            $this->concertService->delete($id);

            return $this->json([
                'success' => true,
                'message' => 'Concert supprimé avec succès'
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

    #[Route('/count', name: 'count', methods: ['GET'])]
    public function count(): JsonResponse
    {
        try {
            $count = $this->concertService->count();
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
     * Convertit une entité Concert en tableau pour la sérialisation JSON
     */
    private function concertToArray(Concert $concert): array
    {
        $data = [
            'id' => $concert->getId(),
            'date' => $concert->getDate()?->format('Y-m-d'),
            'time' => $concert->getTime()?->format('H:i:s'),
            'duration' => $concert->getDuration(),
            'status' => $concert->getStatus()
        ];

        // Ajouter les relations si elles sont chargées
        if ($concert->getGroup()) {
            $data['group'] = [
                'id' => $concert->getGroup()->getId(),
                'name' => $concert->getGroup()->getName()
            ];
        }

        if ($concert->getSalle()) {
            $data['salle'] = [
                'id' => $concert->getSalle()->getId(),
                'name' => $concert->getSalle()->getName()
            ];
        }

        return $data;
    }
}

