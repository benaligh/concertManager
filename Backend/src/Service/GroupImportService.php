<?php

namespace App\Service;

use App\Entity\Group;
use App\Exception\BusinessException;
use App\Repository\GroupRepository;
use Doctrine\ORM\EntityManagerInterface;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Exception as ReaderException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class GroupImportService
{
    public function __construct(
        private EntityManagerInterface $em,
        private GroupRepository $repository,
        private ValidatorInterface $validator
    ) {
    }

    /**
     * Importe des groupes depuis un fichier Excel
     *
     * @param string $filePath Chemin vers le fichier Excel
     * @return array ['success' => int, 'errors' => array, 'total' => int]
     */
    public function importFromFile(string $filePath): array
    {
        try {
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) < 2) {
                throw new BusinessException('Le fichier Excel doit contenir au moins une ligne de données (en plus de l\'en-tête)');
            }

            // La première ligne contient les en-têtes
            $headers = array_map('trim', $rows[0]);
            $dataRows = array_slice($rows, 1);

            $successCount = 0;
            $errors = [];
            $total = count($dataRows);

            foreach ($dataRows as $index => $row) {
                $rowNumber = $index + 2; // +2 car on commence à la ligne 2 (ligne 1 = headers)
                
                try {
                    $groupData = $this->parseRow($headers, $row, $rowNumber);
                    
                    if (!$groupData) {
                        continue; // Ligne vide ou invalide, on passe
                    }

                    // Vérifier si le groupe existe déjà (par nom)
                    $existingGroup = $this->repository->findOneBy(['name' => $groupData['name']]);
                    if ($existingGroup) {
                        $errors[] = "Ligne {$rowNumber}: Le groupe '{$groupData['name']}' existe déjà";
                        continue;
                    }

                    // Créer le groupe
                    $group = new Group();
                    $this->hydrateGroup($group, $groupData);

                    // Validation
                    $validationErrors = $this->validator->validate($group);
                    if (count($validationErrors) > 0) {
                        $errorMessages = [];
                        foreach ($validationErrors as $error) {
                            $errorMessages[] = $error->getMessage();
                        }
                        $errors[] = "Ligne {$rowNumber}: " . implode(', ', $errorMessages);
                        continue;
                    }

                    $this->em->persist($group);
                    $successCount++;

                } catch (\Exception $e) {
                    $errors[] = "Ligne {$rowNumber}: " . $e->getMessage();
                }
            }

            // Flush toutes les entités en une fois
            if ($successCount > 0) {
                $this->em->flush();
            }

            return [
                'success' => $successCount,
                'errors' => $errors,
                'total' => $total
            ];

        } catch (ReaderException $e) {
            throw new BusinessException('Erreur lors de la lecture du fichier Excel: ' . $e->getMessage());
        } catch (\Exception $e) {
            throw new BusinessException('Erreur lors de l\'import: ' . $e->getMessage());
        }
    }

    /**
     * Parse une ligne Excel en données de groupe
     */
    private function parseRow(array $headers, array $row, int $rowNumber): ?array
    {
        // Créer un tableau associatif avec les headers comme clés
        $data = [];
        foreach ($headers as $index => $header) {
            $value = $row[$index] ?? null;
            $data[$header] = $value !== null ? trim((string)$value) : null;
        }

        // Mapping des colonnes Excel vers les champs de l'entité
        $name = $this->getValue($data, ['Nom du groupe', 'Nom', 'name']);
        $origin = $this->getValue($data, ['Origine', 'origin']);
        
        // Si les champs obligatoires sont vides, on ignore la ligne
        if (empty($name) || empty($origin)) {
            return null;
        }

        $groupData = [
            'name' => $name,
            'origin' => $origin,
            'city' => $this->getValue($data, ['Ville', 'City', 'city']),
            'startYear' => $this->getNumberValue($data, ['Année début', 'Année de début', 'Start Year', 'startYear']),
            'endYear' => $this->getNumberValue($data, ['Année séparation', 'Année de séparation', 'End Year', 'endYear']),
            'founders' => $this->getValue($data, ['Fondateurs', 'Founders', 'founders']),
            'musicalStyle' => $this->getValue($data, ['Courant musical', 'Musical Style', 'musicalStyle', 'musicalCurrent']),
            'membersCount' => $this->getNumberValue($data, ['Membres', 'Members', 'members', 'membersCount'], 1),
            'presentation' => $this->getValue($data, ['Présentation', 'Presentation', 'presentation'])
        ];

        // Validation des champs obligatoires
        if (empty($groupData['musicalStyle'])) {
            throw new BusinessException("Le champ 'Courant musical' est obligatoire");
        }

        if (empty($groupData['membersCount']) || $groupData['membersCount'] < 1) {
            $groupData['membersCount'] = 1;
        }

        return $groupData;
    }

    /**
     * Récupère une valeur depuis le tableau de données en essayant plusieurs clés
     */
    private function getValue(array $data, array $keys): ?string
    {
        foreach ($keys as $key) {
            if (isset($data[$key]) && !empty(trim((string)$data[$key]))) {
                return trim((string)$data[$key]);
            }
        }
        return null;
    }

    /**
     * Récupère une valeur numérique depuis le tableau de données
     */
    private function getNumberValue(array $data, array $keys, ?int $default = null): ?int
    {
        foreach ($keys as $key) {
            if (isset($data[$key]) && $data[$key] !== null && $data[$key] !== '') {
                $value = is_numeric($data[$key]) ? (int)$data[$key] : null;
                if ($value !== null) {
                    return $value;
                }
            }
        }
        return $default;
    }

    /**
     * Hydrate une entité Group avec les données
     */
    private function hydrateGroup(Group $group, array $data): void
    {
        $group->setName($data['name']);
        $group->setOrigin($data['origin']);
        
        if (!empty($data['city'])) {
            $group->setCity($data['city']);
        }
        
        if ($data['startYear'] !== null) {
            $group->setStartYear($data['startYear']);
        }
        
        if ($data['endYear'] !== null) {
            $group->setEndYear($data['endYear']);
        }
        
        if (!empty($data['founders'])) {
            $group->setFounders($data['founders']);
        }
        
        $group->setMusicalStyle($data['musicalStyle']);
        $group->setMembersCount($data['membersCount']);
        
        if (!empty($data['presentation'])) {
            $group->setPresentation($data['presentation']);
        }
    }
}

