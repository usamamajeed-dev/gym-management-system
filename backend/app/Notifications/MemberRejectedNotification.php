<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Tells an applicant their registration was not approved, with the reason. */
class MemberRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->afterCommit();
    }

    /** @return list<string> */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $gym = config('gym.name');

        return (new MailMessage)
            ->subject("Your {$gym} membership registration")
            ->greeting("Hi {$notifiable->name},")
            ->line("Unfortunately we couldn't approve your {$gym} membership registration.")
            ->line("Reason: {$notifiable->rejection_reason}")
            ->line('Please contact the gym if you have any questions.')
            ->salutation("Kind regards,\n{$gym}");
    }
}
