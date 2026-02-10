<?php

namespace App\Service;

use App\Entity\Group;
use App\Exception\BusinessException;
use App\Exception\NotFoundException;
use App\Repository\GroupRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class GroupService
{
    public function __construct(
        private EntityManagerInterface $em,
        private GroupRepository $repository,
        private ValidatorInterface $validator,
        private ActivityService $activityService
    ) {
    }

    /**
     * Liste tous les groupes avec filtres et pagination
     */
    public function findAll(array $filters = [], int $page = 1, int $limit = 10): array
    {
        return $this->repository->findWithFilters($filters, $page, $limit);
    }

    /**
     * Trouve un groupe par ID
     */
    public function find(int $id): Group
    {
        $group = $this->repository->find($id);
        if (!$group) {
            throw new NotFoundException("Groupe avec l'ID {$id} introuvable");
        }
        return $group;
    }

    /**
     * Crée un nouveau groupe
     */
    public function create(array $data): Group
    {
        $group = new Group();
        $this->hydrateGroup($group, $data);

        // Validation
        $errors = $this->validator->validate($group);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            throw new BusinessException('Erreurs de validation: ' . implode(', ', $errorMessages));
        }

        $this->em->persist($group);
        $this->em->flush();

        // Enregistrer l'activité
        $this->activityService->log(
            'group',
            'created',
            'Nouveau groupe ajouté',
            $group->getName(),
            $group->getId()
        );

        return $group;
    }

    /**
     * Met à jour un groupe existant
     */
    public function update(int $id, array $data): Group
    {
        $group = $this->find($id);
        $this->hydrateGroup($group, $data);

        // Validation
        $errors = $this->validator->validate($group);
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
            'group',
            'updated',
            'Groupe modifié',
            $group->getName(),
            $group->getId()
        );

        return $group;
    }

    /**
     * Supprime un groupe
     */
    public function delete(int $id): void
    {
        $group = $this->find($id);
        $groupName = $group->getName();
        
        $this->em->remove($group);
        $this->em->flush();

        // Enregistrer l'activité
        $this->activityService->log(
            'group',
            'deleted',
            'Groupe supprimé',
            $groupName,
            $id
        );
    }

    /**
     * Compte le nombre total de groupes
     */
    public function count(): int
    {
        return $this->repository->count([]);
    }

    /**
     * Hydrate un groupe avec les données
     */
    private function hydrateGroup(Group $group, array $data): void
    {
        if (isset($data['name'])) {
            $group->setName($data['name']);
        }
        if (isset($data['origin'])) {
            $group->setOrigin($data['origin']);
        }
        if (isset($data['city'])) {
            $group->setCity($data['city']);
        }
        if (isset($data['startYear'])) {
            $group->setStartYear($data['startYear']);
        }
        if (isset($data['endYear'])) {
            $group->setEndYear($data['endYear']);
        }
        if (isset($data['founders'])) {
            $group->setFounders($data['founders']);
        }
        if (isset($data['membersCount'])) {
            $group->setMembersCount($data['membersCount']);
        }
        if (isset($data['musicalStyle'])) {
            $group->setMusicalStyle($data['musicalStyle']);
        }
        if (isset($data['presentation'])) {
            $group->setPresentation($data['presentation']);
        }
    }
}

