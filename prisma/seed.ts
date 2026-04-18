// prisma/seed.ts
// Database seeding script for development
// Creates test data: categories, users, articles, comments, reactions, etc.

import { PrismaClient, UserRole, ArticleStatus, CommentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data (order matters for foreign keys)
  console.log('Clearing existing data...');
  await prisma.reaction.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Categories
  console.log('Creating categories...');
  const aiCategory = await prisma.category.create({
    data: {
      nameEn: 'Artificial Intelligence',
      namePt: 'Inteligência Artificial',
      slug: 'ai',
      colorHex: '#06B6D4',
      descriptionEn: 'Exploring advances in AI, machine learning, and neural networks.',
      descriptionPt: 'Explorando avanços em IA, aprendizado de máquina e redes neurais.',
    },
  });

  const scienceCategory = await prisma.category.create({
    data: {
      nameEn: 'Science',
      namePt: 'Ciência',
      slug: 'science',
      colorHex: '#A855F7',
      descriptionEn: 'Latest discoveries in physics, biology, and scientific research.',
      descriptionPt: 'Últimas descobertas em física, biologia e pesquisa científica.',
    },
  });

  const roboticsCategory = await prisma.category.create({
    data: {
      nameEn: 'Robotics',
      namePt: 'Robótica',
      slug: 'robotics',
      colorHex: '#EF4444',
      descriptionEn: 'Innovation in robotics, automation, and autonomous systems.',
      descriptionPt: 'Inovação em robótica, automação e sistemas autônomos.',
    },
  });

  const gadgetsCategory = await prisma.category.create({
    data: {
      nameEn: 'Gadgets',
      namePt: 'Gadgets',
      slug: 'gadgets',
      colorHex: '#F59E0B',
      descriptionEn: 'Latest tech gadgets, devices, and consumer electronics.',
      descriptionPt: 'Últimos gadgets tech, dispositivos e eletrônicos de consumidor.',
    },
  });

  // 2. Create Users
  console.log('Creating users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ctrlaltnews.io',
      emailVerified: true,
      passwordHash: 'hashed_admin_password_12345',
      fullName: 'Admin User',
      username: 'admin',
      bio: 'Site administrator',
      role: UserRole.ADMIN,
    },
  });

  const authorUser = await prisma.user.create({
    data: {
      email: 'author@ctrlaltnews.io',
      emailVerified: true,
      passwordHash: 'hashed_author_password_12345',
      fullName: 'Jane Smith',
      username: 'janesmith',
      bio: 'Tech journalist and AI enthusiast',
      role: UserRole.AUTHOR,
    },
  });

  const readerUser = await prisma.user.create({
    data: {
      email: 'reader@ctrlaltnews.io',
      emailVerified: true,
      passwordHash: 'hashed_reader_password_12345',
      fullName: 'John Doe',
      username: 'johndoe',
      bio: 'Tech news reader',
      role: UserRole.USER,
    },
  });

  // 3. Create Articles
  console.log('Creating articles...');
  const article1 = await prisma.article.create({
    data: {
      titleEn: 'The Future of AI: Transforming Industries',
      titlePt: 'O Futuro da IA: Transformando Indústrias',
      slug: 'future-ai-transforming-industries',
      excerptEn: 'Exploring how artificial intelligence is revolutionizing business, healthcare, and society.',
      excerptPt: 'Explorando como a inteligência artificial está revolucionando negócios, saúde e sociedade.',
      contentEn:
        '# The Future of AI\n\nArtificial intelligence is transforming every industry...\n\nFrom healthcare diagnostics to autonomous vehicles, AI is reshaping our world.',
      contentPt:
        '# O Futuro da IA\n\nA inteligência artificial está transformando cada indústria...\n\nDe diagnósticos de saúde a veículos autônomos, a IA está remodelando nosso mundo.',
      categoryId: aiCategory.id,
      authorId: authorUser.id,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date('2026-04-15'),
      readingTimeMinutes: 8,
      viewCount: 150,
    },
  });

  const article2 = await prisma.article.create({
    data: {
      titleEn: 'Breakthrough in Quantum Computing',
      titlePt: 'Avanço na Computação Quântica',
      slug: 'breakthrough-quantum-computing',
      excerptEn: 'Scientists announce a major breakthrough in quantum computing technology.',
      excerptPt: 'Cientistas anunciam um grande avanço na tecnologia de computação quântica.',
      contentEn:
        '# Quantum Computing Breakthrough\n\nResearchers have achieved a new milestone...\n\nThis breakthrough could revolutionize computing.',
      contentPt:
        '# Avanço na Computação Quântica\n\nOs pesquisadores alcançaram um novo marco...\n\nEste avanço pode revolucionar a computação.',
      categoryId: scienceCategory.id,
      authorId: authorUser.id,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date('2026-04-14'),
      readingTimeMinutes: 6,
      viewCount: 98,
    },
  });

  const article3 = await prisma.article.create({
    data: {
      titleEn: 'Humanoid Robots Enter the Workforce',
      titlePt: 'Robôs Humanóides Entram na Força de Trabalho',
      slug: 'humanoid-robots-workforce',
      excerptEn: 'Exploring the rise of humanoid robots in manufacturing and service industries.',
      excerptPt: 'Explorando a ascensão dos robôs humanóides nas indústrias de manufatura e serviços.',
      contentEn:
        '# Humanoid Robots in the Workplace\n\nThe latest generation of humanoid robots...\n\nThey are becoming increasingly common in factories and businesses.',
      contentPt:
        '# Robôs Humanóides no Local de Trabalho\n\nA última geração de robôs humanóides...\n\nEles estão se tornando cada vez mais comuns em fábricas e negócios.',
      categoryId: roboticsCategory.id,
      authorId: authorUser.id,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date('2026-04-13'),
      readingTimeMinutes: 7,
      viewCount: 175,
    },
  });

  const article4 = await prisma.article.create({
    data: {
      titleEn: 'Best Tech Gadgets of 2026',
      titlePt: 'Melhores Gadgets Tech de 2026',
      slug: 'best-tech-gadgets-2026',
      excerptEn: 'A comprehensive review of the most innovative gadgets released this year.',
      excerptPt: 'Uma análise abrangente dos gadgets mais inovadores lançados este ano.',
      contentEn:
        '# Top Tech Gadgets 2026\n\nThis year has brought some amazing new gadgets...\n\nFrom smartwatches to AR glasses, the innovation is endless.',
      contentPt:
        '# Melhores Gadgets Tech 2026\n\nEste ano trouxe alguns gadgets novos e incríveis...\n\nDe smartwatches a óculos AR, a inovação é infinita.',
      categoryId: gadgetsCategory.id,
      authorId: authorUser.id,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date('2026-04-12'),
      readingTimeMinutes: 10,
      viewCount: 220,
    },
  });

  const article5 = await prisma.article.create({
    data: {
      titleEn: 'Deep Learning Advances',
      titlePt: 'Avanços em Aprendizado Profundo',
      slug: 'deep-learning-advances',
      excerptEn: 'New techniques in deep learning are pushing the boundaries of what AI can do.',
      excerptPt: 'Novas técnicas em aprendizado profundo estão expandindo os limites do que a IA pode fazer.',
      contentEn:
        '# Deep Learning Advances\n\nResearchers have developed new techniques...\n\nThese advances promise faster and more efficient AI models.',
      contentPt:
        '# Avanços em Aprendizado Profundo\n\nOs pesquisadores desenvolveram novas técnicas...\n\nEsses avanços promovem modelos de IA mais rápidos e eficientes.',
      categoryId: aiCategory.id,
      authorId: adminUser.id,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date('2026-04-11'),
      readingTimeMinutes: 5,
      viewCount: 85,
    },
  });

  // 4. Create Tags
  console.log('Creating tags...');
  const tag1 = await prisma.tag.create({
    data: {
      name: 'Machine Learning',
      slug: 'machine-learning',
    },
  });

  const tag2 = await prisma.tag.create({
    data: {
      name: 'Neural Networks',
      slug: 'neural-networks',
    },
  });

  const tag3 = await prisma.tag.create({
    data: {
      name: 'Innovation',
      slug: 'innovation',
    },
  });

  // 5. Associate Articles with Tags
  console.log('Associating articles with tags...');
  await prisma.articleTag.create({
    data: {
      articleId: article1.id,
      tagId: tag1.id,
    },
  });

  await prisma.articleTag.create({
    data: {
      articleId: article1.id,
      tagId: tag2.id,
    },
  });

  await prisma.articleTag.create({
    data: {
      articleId: article5.id,
      tagId: tag1.id,
    },
  });

  // 6. Create Comments
  console.log('Creating comments...');
  const comment1 = await prisma.comment.create({
    data: {
      content: 'Great article! The insights about AI transformation are really helpful.',
      articleId: article1.id,
      authorId: readerUser.id,
      status: CommentStatus.APPROVED,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: 'Can you provide more details about the quantum computing breakthrough?',
      articleId: article2.id,
      authorId: readerUser.id,
      status: CommentStatus.APPROVED,
    },
  });

  const comment3 = await prisma.comment.create({
    data: {
      content: 'This is exactly what I was looking for. Thanks for the detailed analysis!',
      articleId: article3.id,
      authorId: readerUser.id,
      status: CommentStatus.APPROVED,
    },
  });

  // 7. Create Nested Comment (reply to comment1)
  console.log('Creating comment replies...');
  const reply1 = await prisma.comment.create({
    data: {
      content: 'I agree! The transformation is happening faster than expected.',
      articleId: article1.id,
      authorId: authorUser.id,
      parentId: comment1.id,
      status: CommentStatus.APPROVED,
    },
  });

  // 8. Create Reactions
  console.log('Creating reactions...');
  await prisma.reaction.create({
    data: {
      reactionType: 'LIKE',
      count: 1,
      articleId: article1.id,
      userId: readerUser.id,
    },
  });

  await prisma.reaction.create({
    data: {
      reactionType: 'CLAP',
      count: 5,
      articleId: article2.id,
      userId: readerUser.id,
    },
  });

  // 9. Create Bookmarks
  console.log('Creating bookmarks...');
  await prisma.bookmark.create({
    data: {
      userId: readerUser.id,
      articleId: article1.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: readerUser.id,
      articleId: article3.id,
    },
  });

  // 10. Create Page Views
  console.log('Creating page views...');
  await prisma.pageView.create({
    data: {
      pagePath: `/articles/${article1.slug}`,
      userId: readerUser.id,
      articleId: article1.id,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      referrer: 'google.com',
    },
  });

  await prisma.pageView.create({
    data: {
      pagePath: `/category/${aiCategory.slug}`,
      userId: readerUser.id,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
      referrer: 'social-media',
    },
  });

  console.log('Database seeding completed successfully!');
  console.log('Summary:');
  console.log('- 4 categories created');
  console.log('- 3 users created (1 admin, 1 author, 1 reader)');
  console.log('- 5 articles created');
  console.log('- 3 tags created and associated');
  console.log('- 4 comments created (including 1 reply)');
  console.log('- 2 reactions created');
  console.log('- 2 bookmarks created');
  console.log('- 2 page views created');
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
