<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('name', 100)->change();

            $table->string('phone', 20)->nullable()->after('email');
            $table->date('date_of_birth')->nullable()->after('password');
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->string('address', 255)->nullable()->after('gender');
            $table->string('emergency_contact_name', 100)->nullable()->after('address');
            $table->string('emergency_contact_phone', 20)->nullable()->after('emergency_contact_name');
            $table->string('membership_number')->nullable()->unique()->after('emergency_contact_phone');

            $table->string('status')->default('pending')->index()->after('membership_number');
            $table->boolean('is_active')->default(false)->index()->after('status');

            $table->timestamp('approved_at')->nullable()->after('is_active');
            $table->foreignId('approved_by')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable()->after('approved_by');
            $table->foreignId('rejected_by')->nullable()->after('rejected_at')->constrained('users')->nullOnDelete();
            $table->string('rejection_reason', 500)->nullable()->after('rejected_by');

            $table->timestamp('last_login_at')->nullable()->after('rejection_reason');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropConstrainedForeignId('rejected_by');
            $table->dropUnique(['membership_number']);
            $table->dropIndex(['status']);
            $table->dropIndex(['is_active']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'phone', 'date_of_birth', 'gender', 'address', 'emergency_contact_name', 'emergency_contact_phone',
                'membership_number', 'status', 'is_active', 'approved_at', 'rejected_at', 'rejection_reason',
                'last_login_at',
            ]);
            $table->string('name')->change();
        });
    }
};
