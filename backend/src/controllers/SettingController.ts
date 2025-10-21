import { Request, Response } from "express";

import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";

import { head } from "lodash";
import User from "../models/User";
import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import ListSettingsServiceOne from "../services/SettingServices/ListSettingsServiceOne";
import GetSettingService from "../services/SettingServices/GetSettingService";
import UpdateOneSettingService from "../services/SettingServices/UpdateOneSettingService";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";

type LogoRequest = {
  mode: string;
};

type PrivateFileRequest = {
  settingKey: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  // if (req.user.profile !== "admin") {
  //   throw new AppError("ERR_NO_PERMISSION", 403);
  // }

  const settings = await ListSettingsService({ companyId });

  return res.status(200).json(settings);
};

export const showOne = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { settingKey: key } = req.params;

  console.log("|======== GetPublicSettingService ========|")
  console.log("key", key)
  console.log("|=========================================|")

  
  const settingsTransfTicket = await ListSettingsServiceOne({ companyId: companyId, key: key });

  return res.status(200).json(settingsTransfTicket);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { settingKey: key } = req.params;
  const { value } = req.body;
  const { companyId } = req.user;

  const setting = await UpdateSettingService({
    key,
    value,
    companyId
  });

  const io = getIO();
  io.of(String(companyId))
  .emit(`company-${companyId}-settings`, {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};

export const getSetting = async (
  req: Request,
  res: Response): Promise<Response> => {

  const { settingKey: key } = req.params;

  const setting = await GetSettingService({ key });

  return res.status(200).json(setting);

}

export const updateOne = async (
  req: Request,
  res: Response
): Promise<Response> => {

  const { settingKey: key } = req.params;
  const { value } = req.body;

  const setting = await UpdateOneSettingService({
    key,
    value
  });

  return res.status(200).json(setting); 
};

export const publicShow = async (req: Request, res: Response): Promise<Response> => {
  console.log("|=============== publicShow  ==============|")
  
  const { settingKey: key } = req.params;
  
  const settingValue = await GetPublicSettingService({ key });


  return res.status(200).json(settingValue);
};

export const storeLogo = async (req: Request, res: Response): Promise<Response> => {
  const file = req.file as Express.Multer.File;
  const { mode }: LogoRequest = req.body;
  const { companyId } = req.user;
  const validModes = [ "Light", "Dark", "Favicon" ];

  console.log("|=============== storeLogo  ==============|", storeLogo)

  if ( validModes.indexOf(mode) === -1 ) {
    return res.status(406);
  }

  if (file && file.mimetype.startsWith("image/")) {
    
    const setting = await UpdateSettingService({
      key: `appLogo${mode}`,
      value: file.filename,
      companyId
    });
    
    return res.status(200).json(setting.value);
  }
  
  return res.status(406);
}

export const certUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { body } = req.body;
  const { companyId } = req.user;

  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para esta ação!");
  }

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (companyId !== 1) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const files = req.files as Express.Multer.File[];
  const file = head(files);
  console.log(file);
  return res.send({ mensagem: "Arquivo Anexado" });
};

export const storePrivateFile = async (req: Request, res: Response): Promise<Response> => {
  const file = req.file as Express.Multer.File;
  const { settingKey }: PrivateFileRequest = req.body;
  const { companyId } = req.user;


  console.log("|=============== storePrivateFile  ==============|", storeLogo)

  const setting = await UpdateSettingService({
    key: `_${settingKey}`,
    value: file.filename,
    companyId
  });
  
  return res.status(200).json(setting.value);
}
