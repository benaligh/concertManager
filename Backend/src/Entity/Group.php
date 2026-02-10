<?php

namespace App\Entity;

use App\Repository\GroupRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: GroupRepository::class)]
#[ORM\Table(name: '`groups`')]
#[ORM\HasLifecycleCallbacks]
class Group
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire')]
    #[Assert\Length(min: 1, max: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'L\'origine est obligatoire')]
    #[Assert\Length(min: 1, max: 255)]
    private ?string $origin = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Length(max: 255)]
    private ?string $city = null;

    #[ORM\Column(nullable: true)]
    #[Assert\Type(type: 'integer')]
    #[Assert\Range(min: 1900, max: 2100)]
    private ?int $startYear = null;

    #[ORM\Column(nullable: true)]
    #[Assert\Type(type: 'integer')]
    #[Assert\Range(min: 1900, max: 2100)]
    private ?int $endYear = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $founders = null;

    #[ORM\Column]
    #[Assert\NotBlank(message: 'Le nombre de membres est obligatoire')]
    #[Assert\Type(type: 'integer')]
    #[Assert\Positive(message: 'Le nombre de membres doit être positif')]
    private ?int $membersCount = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le style musical est obligatoire')]
    #[Assert\Length(min: 1, max: 255)]
    private ?string $musicalStyle = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $presentation = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'group', targetEntity: Concert::class, cascade: ['remove'])]
    private Collection $concerts;

    public function __construct()
    {
        $this->concerts = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getOrigin(): ?string
    {
        return $this->origin;
    }

    public function setOrigin(string $origin): static
    {
        $this->origin = $origin;
        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(?string $city): static
    {
        $this->city = $city;
        return $this;
    }

    public function getStartYear(): ?int
    {
        return $this->startYear;
    }

    public function setStartYear(?int $startYear): static
    {
        $this->startYear = $startYear;
        return $this;
    }

    public function getEndYear(): ?int
    {
        return $this->endYear;
    }

    public function setEndYear(?int $endYear): static
    {
        $this->endYear = $endYear;
        return $this;
    }

    public function getFounders(): ?string
    {
        return $this->founders;
    }

    public function setFounders(?string $founders): static
    {
        $this->founders = $founders;
        return $this;
    }

    public function getMembersCount(): ?int
    {
        return $this->membersCount;
    }

    public function setMembersCount(int $membersCount): static
    {
        $this->membersCount = $membersCount;
        return $this;
    }

    public function getMusicalStyle(): ?string
    {
        return $this->musicalStyle;
    }

    public function setMusicalStyle(string $musicalStyle): static
    {
        $this->musicalStyle = $musicalStyle;
        return $this;
    }

    public function getPresentation(): ?string
    {
        return $this->presentation;
    }

    public function setPresentation(?string $presentation): static
    {
        $this->presentation = $presentation;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    /**
     * @return Collection<int, Concert>
     */
    public function getConcerts(): Collection
    {
        return $this->concerts;
    }

    public function addConcert(Concert $concert): static
    {
        if (!$this->concerts->contains($concert)) {
            $this->concerts->add($concert);
            $concert->setGroup($this);
        }

        return $this;
    }

    public function removeConcert(Concert $concert): static
    {
        if ($this->concerts->removeElement($concert)) {
            if ($concert->getGroup() === $this) {
                $concert->setGroup(null);
            }
        }

        return $this;
    }
}

