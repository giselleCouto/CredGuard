ALTER TABLE `customer_scores` MODIFY COLUMN `produto` enum('CARTAO','CARNE','EMPRESTIMO_PESSOAL') NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_scores` MODIFY COLUMN `ultimo_movimento` varchar(50);--> statement-breakpoint
ALTER TABLE `customer_scores` ADD `score_interno` varchar(10);--> statement-breakpoint
ALTER TABLE `customer_scores` ADD `score_serasa` int;--> statement-breakpoint
ALTER TABLE `customer_scores` ADD `pendencias` int;--> statement-breakpoint
ALTER TABLE `customer_scores` ADD `protestos` int;--> statement-breakpoint
ALTER TABLE `customer_scores` ADD `bureau_source` varchar(50);--> statement-breakpoint
ALTER TABLE `customer_scores` DROP COLUMN `created_at`;