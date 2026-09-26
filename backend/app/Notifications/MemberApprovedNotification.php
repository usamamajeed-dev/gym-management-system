<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Tells a member their registration was approved and they can now log in. */
class MemberApprovedNotification extends Notification implements ShouldQueue
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
            ->subject("Your {$gym} membership is approved")
            ->greeting("Hi {$notifiable->name},")
            ->line("Good news — your {$gym} membership has been approved.")
            ->line("Your membership number is **{$notifiable->membership_number}**.")
            ->line('You can now log in to the member app with the email and password you registered with.')
            ->salutation("See you at the gym,\n{$gym}");
    }
}
