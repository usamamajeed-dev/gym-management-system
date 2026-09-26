<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Base\BaseRepository;

class UserRepository extends BaseRepository
{
    public function model(): string
    {
        return User::class;
    }

    public function findByEmail(string $email): ?User
    {
        /** @var User|null */
        return $this->query()->where('email', strtolower(trim($email)))->first();
    }
}
