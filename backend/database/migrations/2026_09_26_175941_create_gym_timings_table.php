<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per weekday. Times are wall-clock times in the gym's timezone.
        Schema::create('gym_timings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedTinyInteger('day_of_week')->unique()->comment('0 = Sunday … 6 = Saturday');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_timings');
    }
};
