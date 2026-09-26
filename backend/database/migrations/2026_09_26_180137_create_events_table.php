<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // starts_at / ends_at are stored in UTC.
        Schema::create('events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('event_type_id')->constrained('event_types')->restrictOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('location', 150)->nullable();
            $table->string('image_path')->nullable();
            $table->dateTime('starts_at')->index();
            $table->dateTime('ends_at')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->boolean('is_published')->default(false)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
