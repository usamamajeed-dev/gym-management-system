<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\ErrorCode;
use App\Exceptions\ApiException;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks a member whose membership is no longer approved and active, even if
 * they still hold a token (e.g. deactivated after logging in).
 */
class EnsureMemberIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->isMember() && ! $user->canLogInAsMember()) {
            throw ApiException::forbidden('Your membership is not active.', ErrorCode::MEMBER_INACTIVE->value);
        }

        return $next($request);
    }
}
