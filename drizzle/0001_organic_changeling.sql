CREATE TABLE `driftMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelId` int NOT NULL,
	`driftScore` int NOT NULL,
	`status` enum('NO_DRIFT','MODERATE','CRITICAL') NOT NULL,
	`recommendation` text NOT NULL,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driftMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`creditType` enum('CARTAO','EMPRESTIMO_PESSOAL','CARNE','FINANCIAMENTO') NOT NULL,
	`version` varchar(50) NOT NULL,
	`status` enum('development','staging','production','deprecated') NOT NULL DEFAULT 'development',
	`accuracy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`predictionId` varchar(100) NOT NULL,
	`tenantId` int NOT NULL,
	`modelId` int NOT NULL,
	`creditType` varchar(50) NOT NULL,
	`riskClass` varchar(10) NOT NULL,
	`probability` int NOT NULL,
	`recommendedLimit` int,
	`inputData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`),
	CONSTRAINT `predictions_predictionId_unique` UNIQUE(`predictionId`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`plan` enum('basic','professional','enterprise') NOT NULL DEFAULT 'basic',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
