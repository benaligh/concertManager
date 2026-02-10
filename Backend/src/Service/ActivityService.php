<?php

namespace App\Service;

use App\Entity\Activity;
use App\Repository\ActivityRepository;
use Doctrine\ORM\EntityManagerInterface;

class ActivityService
{
    public function __construct(
        private EntityManagerInterface $em,
        private ActivityRepository $repository
    ) {
    }

    /**
     * Enregistre une activité
     */
    public function log(string $type, string $action, string $message, ?string $details = null, ?int $entityId = null): void
    {
        $activity = new Activity();
        $activity->setType($type);
        $activity->setAction($action);
        $activity->setMessage($message);
        $activity->setDetails($details);
        $activity->setEntityId($entityId);

        $this->em->persist($activity);
        $this->em->flush();
    }

    /**
     * Récupère les activités récentes
     */
    public function getRecent(int $limit = 10): array
    {
        return $this->repository->findRecent($limit);
    }
}

