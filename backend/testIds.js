import prisma from './src/index.js';

async function checkIds() {
  const trainingPlanId = 557;
  const weekId = 4964;
  const nutritionTipId = 11424;

  const plan = await prisma.trainingPlan.findUnique({ where: { id: trainingPlanId } });
  const week = await prisma.week.findUnique({ where: { id: weekId } });
  const tip = await prisma.nutritionTip.findUnique({ where: { id: nutritionTipId } });

  console.log('TrainingPlan exists:', !!plan);
  console.log('Week exists:', !!week);
  console.log('NutritionTip exists:', !!tip);

  process.exit(0);
}

checkIds().catch(e => {
  console.error(e);
  process.exit(1);
});
