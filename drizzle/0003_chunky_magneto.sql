CREATE TABLE `batch_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` varchar(100) NOT NULL,
	`tenant_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_size` int NOT NULL,
	`total_rows` int,
	`processed_rows` int DEFAULT 0,
	`status` enum('queued','processing','completed','failed') NOT NULL DEFAULT 'queued',
	`error_message` text,
	`result_csv_path` varchar(500),
	`queued_at` timestamp NOT NULL DEFAULT (now()),
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `batch_jobs_job_id_unique` UNIQUE(`job_id`)
);
--> statement-breakpoint
CREATE TABLE `customer_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`batch_job_id` int NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`nome` varchar(255),
	`email` varchar(320),
	`telefone` varchar(20),
	`data_nascimento` varchar(10),
	`renda` varchar(20),
	`produto` enum('CARTAO','EMPRESTIMO_PESSOAL','CARNE') NOT NULL,
	`data_compra` varchar(10),
	`valor_compra` varchar(20),
	`data_pagamento` varchar(10),
	`status_pagamento` varchar(50),
	`dias_atraso` int,
	`raw_data` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`batch_job_id` int NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`nome` varchar(255),
	`produto` enum('CARTAO','EMPRESTIMO_PESSOAL','CARNE') NOT NULL,
	`score_prob_inadimplencia` varchar(10),
	`faixa_score` enum('A','B','C','D','E'),
	`motivo_exclusao` varchar(100),
	`meses_historico` int,
	`ultimo_movimento` varchar(10),
	`data_processamento` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `batch_jobs` ADD CONSTRAINT `batch_jobs_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_data` ADD CONSTRAINT `customer_data_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_data` ADD CONSTRAINT `customer_data_batch_job_id_batch_jobs_id_fk` FOREIGN KEY (`batch_job_id`) REFERENCES `batch_jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_scores` ADD CONSTRAINT `customer_scores_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_scores` ADD CONSTRAINT `customer_scores_batch_job_id_batch_jobs_id_fk` FOREIGN KEY (`batch_job_id`) REFERENCES `batch_jobs`(`id`) ON DELETE no action ON UPDATE no action;