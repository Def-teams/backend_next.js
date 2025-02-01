import { NextRequest } from 'next/server'
import multer from 'multer'

export const multerMiddleware = (config: multer.Options) => {
  const upload = multer(config)
  
  return (req: NextRequest) => 
    new Promise((resolve, reject) => {
      upload.single('profileImage')(req as any, {} as any, (err) => {
        err ? reject(err) : resolve(req)
      })
    })
} 