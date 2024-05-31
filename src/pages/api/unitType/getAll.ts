import { UnitType } from "@prisma/client";
import type { NextApiHandler, NextApiResponse } from "next";
import { prisma } from "~/server/db";

export type UnitTypes = UnitType[];

/**
 * @swagger
 * /api/unitType/getAll:
 *   get:
 *     tags:
 *       - UnitType
 *     summary: Retrieves all vessels
 *     description: Returns a list of all vessels formatted for dropdown selection, with each vessel's name as the label and its id as the value.
 *     responses:
 *       200:
 *         description: A list of vessels formatted for dropdown use.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   defaultLength:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal Server Error - if there's an issue fetching the vessels.
 */
const handler: NextApiHandler = async (
  _,
  res: NextApiResponse<UnitTypes>,
) => {
  const allUnitTypes: UnitType[] = await prisma.unitType.findMany();
  res.status(200).json(allUnitTypes);
};

export default handler;
