<?php

namespace App\Controller\Api;

use App\Service\ActivityService;
use App\Service\ConcertService;
use App\Service\GroupService;
use App\Service\SalleService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/dashboard', name: 'api_dashboard_')]
class DashboardController extends AbstractController
{
    public function __construct(
        private GroupService $groupService,
        private SalleService $salleService,
        private ConcertService $concertService,
        private ActivityService $activityService
    ) {
    }

    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        try {
            $groupsCount = $this->groupService->count();
            $sallesCount = $this->salleService->count();
            $concertsCount = $this->concertService->count();

            // Pour le moment, on met growth à 0 (peut être calculé plus tard avec des données historiques)
            $data = [
                'groups' => [
                    'total' => $groupsCount,
                    'growth' => 0
                ],
                'venues' => [
                    'total' => $sallesCount,
                    'growth' => 0
                ],
                'concerts' => [
                    'total' => $concertsCount,
                    'growth' => 0
                ]
            ];

            return $this->json([
                'success' => true,
                'data' => $data
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/recent-activity', name: 'recent_activity', methods: ['GET'])]
    public function recentActivity(): JsonResponse
    {
        try {
            $activities = $this->activityService->getRecent(10);
            
            // Convertir les activités en format attendu par le frontend
            $data = array_map(function ($activity) {
                return [
                    'id' => $activity->getId(),
                    'type' => $activity->getType(),
                    'message' => $activity->getMessage(),
                    'details' => $activity->getDetails(),
                    'timestamp' => $activity->getCreatedAt()?->format('Y-m-d\TH:i:sP')
                ];
            }, $activities);

            return $this->json([
                'success' => true,
                'data' => $data
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

