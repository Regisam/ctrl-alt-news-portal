import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Alice Johnson',
      profile: {
        create: {
          displayName: 'Alice',
          bio: 'Tech writer and AI enthusiast',
          privacy: 'public',
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Bob Smith',
      profile: {
        create: {
          displayName: 'Bob',
          bio: 'Software engineer',
          privacy: 'public',
        },
      },
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'carol@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Carol Davis',
      profile: {
        create: {
          displayName: 'Carol',
          bio: 'Data scientist',
          privacy: 'public',
        },
      },
    },
  });

  console.log('✅ Users created:', { user1, user2, user3 });

  // Create articles
  const article1 = await prisma.article.create({
    data: {
      title: 'Getting Started with AI',
      content: 'An introduction to artificial intelligence...',
      excerpt: 'Learn the basics of AI',
      category: 'AI',
      authorId: user1.id,
      published: true,
      publishedAt: new Date(),
    },
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'TypeScript Best Practices',
      content: 'Write better TypeScript code...',
      excerpt: 'Improve your TypeScript skills',
      category: 'Technology',
      authorId: user2.id,
      published: true,
      publishedAt: new Date(),
    },
  });

  console.log('✅ Articles created:', { article1, article2 });

  // Create following relationship
  await prisma.following.create({
    data: {
      followerId: user2.id,
      followeeId: user1.id,
    },
  });

  console.log('✅ Following relationship created');

  // Create reputation
  await prisma.reputation.create({
    data: {
      userId: user1.id,
      score: 150,
      tier: 'silver',
    },
  });

  console.log('✅ Reputation created');

  console.log('✅ Seed completed successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
