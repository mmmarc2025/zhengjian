CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`photoUrl` text,
	`party` varchar(50),
	`positionType` enum('mayor','councilor','township_mayor','representative','village_chief') NOT NULL,
	`county` varchar(20) NOT NULL,
	`district` varchar(50),
	`constituency` varchar(100),
	`age` int,
	`education` text,
	`experience` text,
	`contact` text,
	`website` text,
	`socialMedia` json,
	`isIncumbent` boolean DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comment_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`candidateId` int,
	`policyId` int,
	`newsId` int,
	`parentId` int,
	`content` text NOT NULL,
	`status` enum('pending','approved','rejected','hidden') NOT NULL DEFAULT 'approved',
	`likesCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issue_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`icon` varchar(50),
	`description` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `issue_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `issue_categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `issue_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int,
	`title` varchar(300) NOT NULL,
	`summary` text,
	`content` text,
	`imageUrl` text,
	`sourceUrl` text,
	`sourceName` varchar(100),
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`isPublished` boolean NOT NULL DEFAULT true,
	`isPinned` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`categoryId` int,
	`title` varchar(200) NOT NULL,
	`summary` text,
	`content` text,
	`source` text,
	`isHighlight` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
