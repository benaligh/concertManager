<?php

namespace App\Repository;

use App\Entity\Salle;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Salle>
 */
class SalleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Salle::class);
    }

    /**
     * Recherche avec filtres et pagination
     *
     * @param array $filters
     * @param int $page
     * @param int $limit
     * @return array ['items' => Salle[], 'total' => int]
     */
    public function findWithFilters(array $filters = [], int $page = 1, int $limit = 10): array
    {
        $qb = $this->createQueryBuilder('s');

        // Filtre par ville
        if (!empty($filters['city'])) {
            $qb->andWhere('s.city = :city')
                ->setParameter('city', $filters['city']);
        }

        // Filtre par capacité minimale
        if (!empty($filters['minCapacity'])) {
            $qb->andWhere('s.capacity >= :minCapacity')
                ->setParameter('minCapacity', $filters['minCapacity']);
        }

        // Compte total
        $totalQb = clone $qb;
        $totalQb->select('COUNT(s.id)');
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

