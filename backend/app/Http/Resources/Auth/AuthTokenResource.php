<?php

declare(strict_types=1);

namespace App\Http\Resources\Auth;

use App\Support\DateFormat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps the login result: ['token' => string, 'expires_at' => ?Carbon, 'user' => JsonResource].
 * The caller picks the user resource (MemberResource or AdminUserResource).
 */
class AuthTokenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'token' => $this->resource['token'],
            'token_type' => 'Bearer',
            'expires_at' => DateFormat::iso($this->resource['expires_at']),
            'user' => $this->resource['user'],
        ];
    }
}
