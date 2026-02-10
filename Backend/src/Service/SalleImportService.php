<?php

namespace App\Service;

use App\Entity\Salle;
use App\Exception\BusinessException;
use App\Repository\SalleRepository;
use Doctrine\ORM\EntityManagerInterface;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Exception as ReaderException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class SalleImportService
{
    public function __construct(
        private EntityManagerInterface $em,
        private SalleRepository $repository,
        private ValidatorInterface $validator
    ) {
    }

    /**
     * Importe des salles depuis un fichier Excel
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
                    $salleData = $this->parseRow($headers, $row, $rowNumber);
                    
                    if (!$salleData) {
                        continue; // Ligne vide ou invalide, on passe
                    }

                    // Vérifier si la salle existe déjà (par nom)
                    $existingSalle = $this->repository->findOneBy(['name' => $salleData['name']]);
                    if ($existingSalle) {
                        $errors[] = "Ligne {$rowNumber}: La salle '{$salleData['name']}' existe déjà";
                        continue;
                    }

                    // Créer la salle
                    $salle = new Salle();
                    $this->hydrateSalle($salle, $salleData);

                    // Validation
                    $validationErrors = $this->validator->validate($salle);
                    if (count($validationErrors) > 0) {
                        $errorMessages = [];
                        foreach ($validationErrors as $error) {
                            $errorMessages[] = $error->getMessage();
                        }
                        $errors[] = "Ligne {$rowNumber}: " . implode(', ', $errorMessages);
                        continue;
                    }

                    $this->em->persist($salle);
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
     * Parse une ligne Excel en données de salle
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
        $name = $this->getValue($data, ['Nom', 'Name', 'name']);
        $city = $this->getValue($data, ['Ville', 'City', 'city']);
        $capacity = $this->getNumberValue($data, ['Capacité', 'Capacity', 'capacity']);
        $address = $this->getValue($data, ['Adresse', 'Address', 'address']);
        
        // Si les champs obligatoires sont vides, on ignore la ligne
        if (empty($name) || empty($city) || empty($capacity) || empty($address)) {
            return null;
        }

        $salleData = [
            'name' => $name,
            'city' => $city,
            'capacity' => $capacity,
            'address' => $address
        ];

        // Validation de la capacité
        if ($salleData['capacity'] < 1) {
            throw new BusinessException("La capacité doit être positive");
        }

        return $salleData;
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
     * Hydrate une entité Salle avec les données
     */
    private function hydrateSalle(Salle $salle, array $data): void
    {
        $salle->setName($data['name']);
        $salle->setCity($data['city']);
        $salle->setCapacity($data['capacity']);
        $salle->setAddress($data['address']);
    }
}

