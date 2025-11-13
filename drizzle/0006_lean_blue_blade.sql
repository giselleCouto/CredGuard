CREATE TABLE `drift_monitoring` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`product` enum('CARTAO','CARNE','EMPRESTIMO_PESSOAL') NOT NULL,
	`model_version_id` int NOT NULL,
	`psi` decimal(5,4) NOT NULL,
	`feature_drift` text,
	`performance_drift` text,
	`status` enum('stable','warning','critical') NOT NULL,
	`alert_sent` boolean NOT NULL DEFAULT false,
	`checked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drift_monitoring_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_version_id` int NOT NULL,
	`tenant_id` int NOT NULL,
	`product` enum('CARTAO','CARNE','EMPRESTIMO_PESSOAL') NOT NULL,
	`reason` text NOT NULL,
	`deployed_by` int NOT NULL,
	`deployed_at` timestamp NOT NULL DEFAULT (now()),
	`rollbacked_at` timestamp,
	CONSTRAINT `model_deployments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`model_name` varchar(255) NOT NULL,
	`version` varchar(50) NOT NULL,
	`product` enum('CARTAO','CARNE','EMPRESTIMO_PESSOAL') NOT NULL,
	`file_path` text NOT NULL,
	`file_size` int NOT NULL,
	`mlflow_run_id` varchar(255),
	`metrics` text,
	`status` enum('uploaded','validated','production','archived') NOT NULL DEFAULT 'uploaded',
	`uploaded_by` int NOT NULL,
	`promoted_by` int,
	`promoted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sustentation_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`plan_type` enum('basic','premium','enterprise') NOT NULL,
	`monthly_price` decimal(10,2) NOT NULL,
	`status` enum('active','suspended','cancelled') NOT NULL DEFAULT 'active',
	`included_retrainings` int NOT NULL,
	`response_time_sla` int NOT NULL,
	`subscribed_at` timestamp NOT NULL DEFAULT (now()),
	`cancelled_at` timestamp,
	CONSTRAINT `sustentation_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `sustentation_plans_tenant_id_unique` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `sustentation_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`product` enum('CARTAO','CARNE','EMPRESTIMO_PESSOAL') NOT NULL,
	`drift_monitoring_id` int,
	`type` enum('drift_alert','manual_request','scheduled') NOT NULL,
	`status` enum('pending','analyzing','collecting_data','retraining','validating','deploying','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`description` text NOT NULL,
	`assigned_to` int,
	`resolution` text,
	`new_model_version_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completed_at` timestamp,
	CONSTRAINT `sustentation_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `drift_monitoring` ADD CONSTRAINT `drift_monitoring_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drift_monitoring` ADD CONSTRAINT `drift_monitoring_model_version_id_model_versions_id_fk` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_deployments` ADD CONSTRAINT `model_deployments_model_version_id_model_versions_id_fk` FOREIGN KEY (`model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_deployments` ADD CONSTRAINT `model_deployments_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_deployments` ADD CONSTRAINT `model_deployments_deployed_by_users_id_fk` FOREIGN KEY (`deployed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_versions` ADD CONSTRAINT `model_versions_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_versions` ADD CONSTRAINT `model_versions_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_versions` ADD CONSTRAINT `model_versions_promoted_by_users_id_fk` FOREIGN KEY (`promoted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustentation_plans` ADD CONSTRAINT `sustentation_plans_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustentation_tickets` ADD CONSTRAINT `sustentation_tickets_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustentation_tickets` ADD CONSTRAINT `sustentation_tickets_plan_id_sustentation_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `sustentation_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustentation_tickets` ADD CONSTRAINT `sustentation_tickets_drift_monitoring_id_drift_monitoring_id_fk` FOREIGN KEY (`drift_monitoring_id`) REFERENCES `drift_monitoring`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustentation_tickets` ADD CONSTRAINT `sustentation_tickets_assigned_to_users_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sustentation_tickets` ADD CONSTRAINT `sustentation_tickets_new_model_version_id_model_versions_id_fk` FOREIGN KEY (`new_model_version_id`) REFERENCES `model_versions`(`id`) ON DELETE no action ON UPDATE no action;