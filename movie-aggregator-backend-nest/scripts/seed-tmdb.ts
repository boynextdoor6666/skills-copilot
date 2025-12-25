import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TmdbService } from '../src/external-api/tmdb.service';
import { ContentService } from '../src/content/content.service';
import { ContentType } from '../src/content/entities/content.entity';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('SeedTmdb');
  
  try {
    const tmdbService = app.get(TmdbService);
    const contentService = app.get(ContentService);

    logger.log('Starting TMDB seeding...');

    // Fetch popular movies (3 pages = 60 movies)
    const pagesToFetch = 3;
    let totalImported = 0;

    for (let page = 1; page <= pagesToFetch; page++) {
      logger.log(`Fetching page ${page}...`);
      const popular = await tmdbService.getPopularMovies(page);
      
      if (!popular || !popular.results) {
        logger.warn(`Failed to fetch page ${page}`);
        continue;
      }

      for (const movieSummary of popular.results) {
        try {
          // Check if exists
          const existing = await contentService.searchContent({ 
            query: movieSummary.title, 
            content_type: ContentType.MOVIE,
            limit: 1 
          });
          
          if (existing && existing.length > 0 && existing[0].title === movieSummary.title) {
            logger.log(`Skipping "${movieSummary.title}" (already exists)`);
            continue;
          }

          // Get full details
          const details = await tmdbService.getMovieDetails(movieSummary.id);
          if (!details) continue;

          const contentData = tmdbService.convertMovieToContent(details);
          
          // Add some random stats for the aggregator feel
          const randomRating = (Math.random() * 2 + 7).toFixed(1); // 7.0 - 9.0
          
          await contentService.createContent({
            ...contentData,
            content_type: ContentType.MOVIE,
            avg_rating: Number(randomRating),
            critics_rating: Number((Number(randomRating) - 0.5 + Math.random()).toFixed(1)),
            audience_rating: Number((Number(randomRating) + 0.2).toFixed(1)),
            reviews_count: Math.floor(Math.random() * 1000),
            hype_index: Math.floor(Math.random() * 100),
          });

          logger.log(`Imported "${movieSummary.title}"`);
          totalImported++;
        } catch (e) {
          logger.error(`Failed to import movie ${movieSummary.id}: ${e.message}`);
        }
      }
    }

    logger.log(`Seeding complete! Imported ${totalImported} movies.`);

  } catch (error) {
    logger.error('Seeding failed', error);
  } finally {
    await app.close();
  }
}

bootstrap();
