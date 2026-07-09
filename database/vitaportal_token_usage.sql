-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 65.1.63.43    Database: vitaportal
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `token_usage`
--

DROP TABLE IF EXISTS `token_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_usage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `model` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gpt',
  `feature` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prompt_tokens` int NOT NULL DEFAULT '0',
  `completion_tokens` int NOT NULL DEFAULT '0',
  `total_tokens` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_tu_user` (`user_id`),
  KEY `idx_tu_model` (`model`),
  KEY `idx_tu_feature` (`feature`),
  KEY `idx_tu_created` (`created_at`),
  CONSTRAINT `fk_token_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_usage`
--

LOCK TABLES `token_usage` WRITE;
/*!40000 ALTER TABLE `token_usage` DISABLE KEYS */;
INSERT INTO `token_usage` VALUES (16,NULL,'gpt','analyze',962,424,1386,'2026-05-08 07:20:44.601000'),(17,NULL,'gpt','analyze',931,423,1354,'2026-05-09 07:05:23.312000'),(18,NULL,'gpt','analyze',931,425,1356,'2026-05-11 05:38:35.857000'),(19,NULL,'gpt','interview',925,280,1205,'2026-05-11 05:40:40.307000'),(20,NULL,'gpt','interview',370,317,687,'2026-05-11 05:41:31.537000'),(21,NULL,'gpt','interview',361,362,723,'2026-05-11 05:49:10.983000'),(22,NULL,'gpt','interview',189,168,357,'2026-05-11 05:50:44.545000'),(23,NULL,'gpt','interview',230,229,459,'2026-05-11 06:04:11.394000'),(24,NULL,'gpt','interview',220,213,433,'2026-05-11 06:07:10.929000'),(25,NULL,'gpt','interview',295,247,542,'2026-05-11 06:13:06.341000'),(26,NULL,'gpt','interview',190,177,367,'2026-05-11 06:14:17.750000'),(27,NULL,'gpt','interview',242,212,454,'2026-05-11 06:46:38.828000'),(28,NULL,'gpt','builder',699,460,1159,'2026-05-11 07:27:40.917000'),(29,NULL,'gpt','builder',112,91,203,'2026-05-11 07:30:18.808000'),(30,NULL,'gpt','analyze',297,259,556,'2026-05-11 07:37:58.559000'),(31,NULL,'gpt','analyze',297,316,613,'2026-05-11 07:38:24.479000'),(32,NULL,'gpt','analyze',297,79,376,'2026-05-11 07:39:10.132000'),(33,NULL,'gpt','analyze',297,383,680,'2026-05-11 07:39:26.341000'),(34,NULL,'gpt','analyze',297,337,634,'2026-05-11 07:40:09.583000'),(35,NULL,'gpt','analyze',1133,737,1870,'2026-05-11 11:32:43.615000'),(36,NULL,'gpt','analyze',1106,477,1583,'2026-05-12 05:48:17.200000');
/*!40000 ALTER TABLE `token_usage` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-12 11:42:23
