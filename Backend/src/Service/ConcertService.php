<?php

namespace App\Service;

use App\Entity\Concert;
use App\Exception\BusinessException;
use App\Exception\NotFoundException;
use App\Repository\ConcertRepository;
use App\Repository\GroupRepository;
use App\Repository\SalleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class ConcertService
{
    public function __construct(
        private EntityManagerInterface $em,
        private ConcertRepository $repository,
        private GroupRepository $groupRepository,
        private SalleRepository $salleRepository,
        private ValidatorInterface $validator,
        private ActivityService $activityService
    ) {
    }

    /**
     * Liste tous les concerts avec filtres et pagination
     */
    public function findAll(array $filters = [], int $page = 1, int $limit = 10): array
    {
        return $this->repository->findWithFilters($filters, $page, $limit);
    }

    /**
     * Trouve un concert par ID avec les relations chargées
     */
    public function find(int $id): Concert
    {
        $qb = $this->repository->createQueryBuilder('c')
            ->leftJoin('c.group', 'g')
            ->leftJoin('c.salle', 's')
            ->addSelect('g', 's')
            ->where('c.id = :id')
            ->setParameter('id', $id);

        $concert = $qb->getQuery()->getOneOrNullResult();
        if (!$concert) {
            throw new NotFoundException("Concert avec l'ID {$id} introuvable");
        }
        return $concert;
    }

    /**
     * Crée un nouveau concert
     */
    public function create(array $data): Concert
    {
        $concert = new Concert();
        $this->hydrateConcert($concert, $data);

        // Validation
        $errors = $this->validator->validate($concert);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $property = $error->getPropertyPath();
                $message = $error->getMessage();
                $errorMessages[] = "{$property}: {$message}";
            }
            throw new BusinessException('Erreurs de validation: ' . implode(' | ', $errorMessages));
        }

        // Les relations sont déjà chargées et attachées à l'EntityManager depuis hydrateConcert
        // On peut directement persister le concert
        $this->em->persist($concert);
        
        try {
            $this->em->flush();
            $concertId = $concert->getId();
            
            if (!$concertId) {
                throw new BusinessException('Erreur: Le concert n\'a pas reçu d\'ID après la persistance');
            }
            
            error_log('Concert persisted successfully with ID: ' . $concertId);
            
            // Recharger le concert avec les relations pour la sérialisation
            // Utiliser find() qui charge automatiquement les relations via leftJoin
            $reloadedConcert = $this->find($concertId);
            if ($reloadedConcert) {
                $concert = $reloadedConcert;
            }
        } catch (NotFoundException $e) {
            // Si le concert n'est pas trouvé après création, c'est un problème grave
            error_log('Error: Concert not found after creation: ' . $e->getMessage());
            throw new BusinessException('Erreur lors de la création du concert: l\'entité n\'a pas pu être sauvegardée');
        } catch (\Exception $e) {
            error_log('Error flushing concert: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            throw new BusinessException('Erreur lors de la sauvegarde du concert: ' . $e->getMessage());
        }

        // Enregistrer l'activité (si possible, sinon ignorer l'erreur)
        try {
            // Les relations sont déjà chargées
            $groupName = $concert->getGroup()?->getName() ?? 'Groupe inconnu';
            $salleName = $concert->getSalle()?->getName() ?? 'Salle inconnue';
            $details = "{$groupName} - {$salleName}";
            
            $this->activityService->log(
                'concert',
                'created',
                'Concert programmé',
                $details,
                $concert->getId()
            );
        } catch (\Exception $e) {
            // Ne pas faire échouer la création si l'activité ne peut pas être enregistrée
            // (par exemple si la table activities n'existe pas encore)
            error_log('Warning: Could not log activity: ' . $e->getMessage());
        }

        return $concert;
    }

    /**
     * Met à jour un concert existant
     */
    public function update(int $id, array $data): Concert
    {
        $concert = $this->find($id);
        $this->hydrateConcert($concert, $data);

        // Validation
        $errors = $this->validator->validate($concert);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $property = $error->getPropertyPath();
                $message = $error->getMessage();
                $errorMessages[] = "{$property}: {$message}";
            }
            throw new BusinessException('Erreurs de validation: ' . implode(' | ', $errorMessages));
        }

        $this->em->flush();

        // Enregistrer l'activité
        $groupName = $concert->getGroup()?->getName() ?? 'Groupe inconnu';
        $salleName = $concert->getSalle()?->getName() ?? 'Salle inconnue';
        $details = "{$groupName} - {$salleName}";
        
        $this->activityService->log(
            'concert',
            'updated',
            'Concert modifié',
            $details,
            $concert->getId()
        );

        return $concert;
    }

    /**
     * Supprime un concert
     */
    public function delete(int $id): void
    {
        $concert = $this->find($id);
        $groupName = $concert->getGroup()?->getName() ?? 'Groupe inconnu';
        $salleName = $concert->getSalle()?->getName() ?? 'Salle inconnue';
        $details = "{$groupName} - {$salleName}";
        
        $this->em->remove($concert);
        $this->em->flush();

        // Enregistrer l'activité
        $this->activityService->log(
            'concert',
            'deleted',
            'Concert supprimé',
            $details,
            $id
        );
    }

    /**
     * Compte le nombre total de concerts
     */
    public function count(): int
    {
        return $this->repository->count([]);
    }

    /**
     * Hydrate un concert avec les données
     */
    private function hydrateConcert(Concert $concert, array $data): void
    {
        // Date (obligatoire)
        if (!isset($data['date']) || empty($data['date'])) {
            throw new BusinessException('La date est obligatoire');
        }
        try {
            $date = is_string($data['date']) ? new \DateTime($data['date']) : $data['date'];
            $concert->setDate($date);
        } catch (\Exception $e) {
            throw new BusinessException('Format de date invalide: ' . $e->getMessage());
        }

        // Heure (obligatoire)
        if (!isset($data['time']) || empty($data['time'])) {
            throw new BusinessException('L\'heure est obligatoire');
        }
        try {
            if (is_string($data['time'])) {
                // Format "HH:MM" -> créer un DateTime avec seulement l'heure
                $timeParts = explode(':', $data['time']);
                if (count($timeParts) < 2) {
                    throw new BusinessException('Format d\'heure invalide. Format attendu: HH:MM');
                }
                $time = new \DateTime();
                $time->setTime((int)$timeParts[0], (int)($timeParts[1] ?? 0), 0);
            } else {
                $time = $data['time'];
            }
            $concert->setTime($time);
        } catch (\Exception $e) {
            throw new BusinessException('Format d\'heure invalide: ' . $e->getMessage());
        }

        // Durée (obligatoire)
        if (!isset($data['duration'])) {
            throw new BusinessException('La durée est obligatoire');
        }
        $duration = is_numeric($data['duration']) ? (int) $data['duration'] : null;
        if ($duration === null || $duration < 1) {
            throw new BusinessException('La durée doit être un nombre entier positif (en heures)');
        }
        $concert->setDuration($duration);

        // Statut (optionnel, par défaut 'planned')
        if (isset($data['status'])) {
            $concert->setStatus($data['status']);
        }

        // Groupe (obligatoire)
        if (!isset($data['groupId'])) {
            throw new BusinessException('Le groupe est obligatoire');
        }
        $groupId = is_numeric($data['groupId']) ? (int) $data['groupId'] : null;
        if ($groupId === null) {
            throw new BusinessException('L\'ID du groupe doit être un nombre');
        }
        $group = $this->groupRepository->find($groupId);
        if (!$group) {
            throw new NotFoundException("Groupe avec l'ID {$groupId} introuvable");
        }
        $concert->setGroup($group);

        // Salle (obligatoire)
        if (!isset($data['salleId'])) {
            throw new BusinessException('La salle est obligatoire');
        }
        $salleId = is_numeric($data['salleId']) ? (int) $data['salleId'] : null;
        if ($salleId === null) {
            throw new BusinessException('L\'ID de la salle doit être un nombre');
        }
        $salle = $this->salleRepository->find($salleId);
        if (!$salle) {
            throw new NotFoundException("Salle avec l'ID {$salleId} introuvable");
        }
        $concert->setSalle($salle);
    }
}

