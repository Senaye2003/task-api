import prisma from '../config/db.js';

export async function findAll() {
  return prisma.task.findMany();
}


export async function create(data) {
  return prisma.task.create({
    data,
  });
}

export async function findById(id) {
  return prisma.task.findUnique({
    where: { id },
  });
}

export async function updateById(id, data) {
  return prisma.task.update({
    where: { id },
    data,
  });
}

export async function deleteById(id) {
  return prisma.task.delete({
    where: { id },
  });
}