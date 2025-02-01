import { NextApiRequest, NextApiResponse } from 'next'
import multer from 'multer'

export const multerMiddleware = (config: multer.Options) => {
  const upload = multer(config)
  
  return (req: NextApiRequest, res: NextApiResponse) => 
    new Promise((resolve, reject) => {
      upload.single('profileImage')(req as any, res as any, (err) => {
        err ? reject(err) : resolve(req)
      })
    })
} 