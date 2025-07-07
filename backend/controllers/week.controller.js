import prisma from '../src/index.js';

export const getWeeksByPlanId = async (req, res) => {
  const planId = parseInt(req.params.planId);
  try {
    const weeks = await prisma.week.findMany(
    {
      where: { training_plan_id: planId} 
    });
    res.json(weeks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur de récupération des semaines"});
  }
};

export const getWeekById = async (req, res) => {
  const weekId = parseInt(req.params.id);
  try {
    const week = await prisma.week.findUnique({
      where: { id: weekId }
    });
    if (!week) return res.status(404).json({ error: "Semaine non trouvée"});
    res.json(week);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur'});
  }
};

export const createWeek = async (req, res) => {
  const { training_plan_id, week_number, description } = req.body;
  try {
    const newWeek = await prisma.week.create({
      data: { training_plan_id, week_number, description }
    });
    res.status(201).json(newWeek);
  } catch (error) {
    res.status(500).json({ error: 'Erreur création semaine'});
  }
};

export const updateWeek = async (req,res) => {
  const weekId = parseInt(req.params.id);
  const { week_number, description } = req.body;
  try {
    const updatedWeek = await prisma.week.update({
      where: { id: weekId },
      data: { week_number, description }
    });
    res.json(updatedWeek);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour semaine' });
  }
};

export const deleteWeek = async (req, res) => {
  const weekId = parseInt(req.params.id);
  try {
    await prisma.week.delete({ where: { id: weekId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression semaine' });
  }
};