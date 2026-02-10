<?php

namespace App\Repository;

use App\Entity\Group;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Group>
 */
class GroupRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Group::class);
    }

    /**
     * Recherche avec filtres et pagination
     *
     * @param array $filters
     * @param int $page
     * @param int $limit
     * @return array ['items' => Group[], 'total' => int]
     */
    public function findWithFilters(array $filters = [], int $page = 1, int $limit = 10): array
    {
        $qb = $this->createQueryBuilder('g');

        // Filtre par nom (LIKE)
        if (!empty($filters['name'])) {
            $qb->andWhere('g.name LIKE :name')
                ->setParameter('name', '%' . $filters['name'] . '%');
        }

        // Filtre par ville
        if (!empty($filters['city'])) {
            $qb->andWhere('g.city = :city')
                ->setParameter('city', $filters['city']);
        }

        // Filtre par style musical
        if (!empty($filters['musicalStyle'])) {
            $qb->andWhere('g.musicalStyle = :musicalStyle')
                ->setParameter('musicalStyle', $filters['musicalStyle']);
        }

        // Filtre par année de début
        if (!empty($filters['startYear'])) {
            $qb->andWhere('g.startYear = :startYear')
                ->setParameter('startYear', $filters['startYear']);
        }

        // Tri par createdAt DESC
        $qb->orderBy('g.createdAt', 'DESC');

        // Compte total
        $totalQb = clone $qb;
        $totalQb->select('COUNT(g.id)');
        $total = (int) $totalQb->getQuery()->getSingleScalarResult();

        // Pagination
        $offset = ($page - 1) * $limit;
        $qb->setFirstResult($offset)
            ->setMaxResults($limit);

        $items = $qb->getQuery()->getResult();

        return [
            'items' => $items,
            'total' => $total
        ];
    }
}

