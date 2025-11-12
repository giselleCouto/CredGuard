CREATE TABLE `bureau_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`score_serasa` int,
	`pendencias` int DEFAULT 0,
	`protestos` int DEFAULT 0,
	`valor_divida` decimal(15,2),
	`cadastro_positivo` boolean DEFAULT false,
	`source` varchar(50) NOT NULL,
	`cached_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `bureau_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_bureau_config` (
	`tenant_id` int NOT NULL,
	`bureau_enabled` boolean NOT NULL DEFAULT false,
	`bureau_provider` varchar(50) NOT NULL DEFAULT 'apibrasil',
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_bureau_config_tenant_id` PRIMARY KEY(`tenant_id`)
);
--> statement-breakpoint
ALTER TABLE `bureau_cache` ADD CONSTRAINT `bureau_cache_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_bureau_config` ADD CONSTRAINT `tenant_bureau_config_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;