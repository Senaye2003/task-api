import prisma from '../src/config/db.js';

async function main() {
  await prisma.$queryRaw`TRUNCATE tasks RESTART IDENTITY;`;
  await prisma.task.createMany({
    data: [
      {
        title: 'Set up project repository',
        completed: true,
      },
      {
        title: 'Install dependencies',
        completed: true,
      },
      {
        title: 'Create Task model',
        completed: false,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
