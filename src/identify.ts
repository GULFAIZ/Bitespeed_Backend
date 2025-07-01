import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

export default async function identify(req: Request, res: Response, prisma: PrismaClient) {
  const { email, phoneNumber } = req.body

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'Email or phoneNumber required' })
  }

  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email || undefined },
        { phoneNumber: phoneNumber || undefined }
      ]
    }
  })

  let primaryContact = null
  let allContacts = [...contacts]

  if (contacts.length > 0) {
    primaryContact = contacts.find(c => c.linkPrecedence === 'primary') ||
                     await prisma.contact.findUnique({ where: { id: contacts[0].linkedId! } })
  }

  if (primaryContact) {
    const alreadyExists = contacts.some(c =>
      c.email === email && c.phoneNumber === phoneNumber
    )

    if (!alreadyExists && (email || phoneNumber)) {
      const newContact = await prisma.contact.create({
        data: {
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
          linkedId: primaryContact.id,
          linkPrecedence: 'secondary'
        }
      })
      allContacts.push(newContact)
    }
  } else {
    primaryContact = await prisma.contact.create({
      data: {
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        linkPrecedence: 'primary'
      }
    })
    allContacts.push(primaryContact)
  }

  const primaryId = primaryContact.id
  const emails = Array.from(new Set(
    allContacts.map(c => c.email).filter(e => e != null)
  )) as string[]

  const phones = Array.from(new Set(
    allContacts.map(c => c.phoneNumber).filter(p => p != null)
  )) as string[]

  const secondaryIds = allContacts
    .filter(c => c.linkPrecedence === 'secondary' && c.linkedId === primaryId)
    .map(c => c.id)

  return res.json({
    contact: {
      primaryContatctId: primaryId,
      emails,
      phoneNumbers: phones,
      secondaryContactIds: secondaryIds
    }
  })
}
