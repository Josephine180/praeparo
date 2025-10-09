import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticate } from "../middlewares/auth.js";

const SECRET = "secretTestKey";

describe("Tests sécurité : bcrypt, JWT et middleware", () => {

  test("Le hash doit être différent du mot de passe original", async () => {
    const password = "Test1234";
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
  });

  test("bcrypt.compare doit valider un mot de passe correct", async () => {
    const password = "Test1234";
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  test("JWT doit contenir les bonnes informations", () => {
    const token = jwt.sign({ userId: 1, role: "user" }, SECRET, { expiresIn: "4h" });
    const decoded = jwt.verify(token, SECRET);
    expect(decoded.userId).toBe(1);
    expect(decoded.role).toBe("user");
  });

  test("jwt.verify doit lever une erreur si le token est expiré", () => {
    const token = jwt.sign({ userId: 1 }, SECRET, { expiresIn: "0s" });
    expect(() => jwt.verify(token, SECRET)).toThrow("jwt expired");
  });

  test("Middleware doit rejeter une requête sans token", () => {
    const req = { cookies: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

});
