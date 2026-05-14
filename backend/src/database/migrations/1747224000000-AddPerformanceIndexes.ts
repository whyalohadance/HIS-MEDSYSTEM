import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1747224000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Appointments — часто фильтруется по дате, пациенту, доктору, статусу
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_appointments_patientId ON appointments("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_appointments_doctorId ON appointments("doctorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`,
    );

    // Studies — RIS worklist фильтрует по пациенту и статусу
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_studies_patientId ON studies("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_studies_status ON studies(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_studies_type ON studies(type)`,
    );

    // Lab orders — LIS worklist фильтрует по пациенту и статусу
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_lab_orders_patientId ON lab_orders("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_lab_orders_priority ON lab_orders(priority)`,
    );

    // Users — поиск по роли (RoleGuard, дашборды)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    );

    // Notifications — фильтр по пользователю и isRead
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications("isRead")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_patientId`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_doctorId`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_studies_patientId`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_studies_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_studies_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_lab_orders_patientId`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_lab_orders_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_lab_orders_priority`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_userId`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_isRead`);
  }
}
