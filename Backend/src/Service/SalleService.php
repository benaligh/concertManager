<?php

namespace App\Service;

use App\Entity\Salle;
use App\Exception\BusinessException;
use App\Exception\NotFoundException;
use App\Repository\SalleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class SalleService
{
    public function __construct(
        private EntityManagerInterface $em,
        private SalleRepository $repository,
        private ValidatorInterface $validator,
        private ActivityService $activityService
    ) {
    }

    /**
     * Liste toutes les salles avec filtres et pagination
     */
    public function findAll(array $filters = [], int $page = 1, int $limit = 10): array
    {
        return $this->repository->findWithFilters($filters, $page, $limit);
    }

    /**
     * Trouve une salle par ID
     */
    public function find(int $id): Salle
    {
        $salle = $this->repository->find($id);
        if (!$salle) {
            throw new NotFoundException("Salle avec l'ID {$id} introuvable");
        }
        return $salle;
    }

    /**
     * Crée une nouvelle salle
     */
    public function create(array $data): Salle
    {
        $salle = new Salle();
        $this->hydrateSalle($salle, $data);

        // Validation
        $errors = $this->validator->validate($salle);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            throw new BusinessException('Erreurs de validation: ' . implode(', ', $errorMessages));
        }

        $this->em->persist($salle);
        $this->em->flush();

        // Enregistrer l'activité
        $this->activityService->log(
            'venue',
            'created',
            'Nouvelle salle créée',
            $salle->getName(),
            $salle->getId()
        );

        return $salle;
    }

    /**
     * Met à jour une salle existante
     */
    public function update(int $id, array $data): Salle
    {
        $salle = $this->find($id);
        $this->hydrateSalle($salle, $data);

        // Validation
        $errors = $this->validator->validate($salle);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            throw new BusinessException('Erreurs de validation: ' . implode(', ', $errorMessages));
        }

        $this->em->flush();

        // Enregistrer l'activité
        $this->activityService->log(
            'venue',
            'updated',
            'Salle modifiée',
            $salle->getName(),
            $salle->getId()
        );

        return $salle;
    }

    /**
     * Supprime une salle
     */
    public function delete(int $id): void
    {
        $salle = $this->find($id);
        $salleName = $salle->getName();
        
        $this->em->remove($salle);
        $this->em->flush();

        // Enregistrer l'activité
        $this->activityService->log(
            'venue',
            'deleted',
            'Salle supprimée',
            $salleName,
            $id
        );
    }

    /**
     * Compte le nombre total de salles
     */
    public function count(): int
    {
        return $this->repository->count([]);
    }

    /**
     * Hydrate une salle avec les données
     */
    private function hydrateSalle(Salle $salle, array $data): void
    {
        if (isset($data['name'])) {
            $salle->setName($data['name']);
        }
        if (isset($data['city'])) {
            $salle->setCity($data['city']);
        }
        if (isset($data['capacity'])) {
            $salle->setCapacity($data['capacity']);
        }
        if (isset($data['address'])) {
            $salle->setAddress($data['address']);
        }
    }
}

