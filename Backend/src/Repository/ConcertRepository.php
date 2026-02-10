<?php

namespace App\Repository;

use App\Entity\Concert;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Concert>
 */
class ConcertRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Concert::class);
    }

    /**
     * Recherche avec filtres et pagination
     *
     * @param array $filters
     * @param int $page
     * @param int $limit
     * @return array ['items' => Concert[], 'total' => int]
     */
    public function findWithFilters(array $filters = [], int $page = 1, int $limit = 10): array
    {
        $qb = $this->createQueryBuilder('c')
            ->leftJoin('c.group', 'g')
            ->leftJoin('c.salle', 's')
            ->addSelect('g', 's');

        // Filtre par statut
        if (!empty($filters['status'])) {
            $qb->andWhere('c.status = :status')
                ->setParameter('status', $filters['status']);
        }

        // Filtre par date
        if (!empty($filters['date'])) {
            $qb->andWhere('c.date = :date')
                ->setParameter('date', $filters['date']);
        }

        // Filtre par salle
        if (!empty($filters['salleId'])) {
            $qb->andWhere('c.salle = :salleId')
                ->setParameter('salleId', $filters['salleId']);
        }

        // Filtre par groupe
        if (!empty($filters['groupId'])) {
            $qb->andWhere('c.group = :groupId')
                ->setParameter('groupId', $filters['groupId']);
        }

        // Tri par date ASC
        $qb->orderBy('c.date', 'ASC')
            ->addOrderBy('c.time', 'ASC');

        // Compte total
        $totalQb = clone $qb;
        $totalQb->select('COUNT(c.id)');
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

