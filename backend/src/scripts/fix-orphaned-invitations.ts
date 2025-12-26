import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * This script fixes orphaned club invitations that were created before
 * the notification system was implemented. It creates notifications for
 * any pending invitations that don't have them.
 */
async function fixOrphanedInvitations() {
  console.log('Looking for orphaned club invitations...')

  // Find all pending invitations
  const pendingInvitations = await prisma.clubInvitation.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      notifications: true,
      club: {
        select: {
          name: true,
        },
      },
      invitedUser: {
        select: {
          username: true,
        },
      },
    },
  })

  console.log(`Found ${pendingInvitations.length} pending invitations`)

  // Filter invitations without notifications
  const orphanedInvitations = pendingInvitations.filter(
    (invitation) => invitation.notifications.length === 0
  )

  if (orphanedInvitations.length === 0) {
    console.log('No orphaned invitations found!')
    return
  }

  console.log(`Found ${orphanedInvitations.length} orphaned invitations:`)
  orphanedInvitations.forEach((inv) => {
    console.log(
      `  - User: ${inv.invitedUser.username}, Club: ${inv.club.name}, Created: ${inv.createdAt.toISOString()}`
    )
  })

  // Create notifications for orphaned invitations
  console.log('\nCreating notifications...')
  for (const invitation of orphanedInvitations) {
    await prisma.notification.create({
      data: {
        userId: invitation.invitedUserId,
        type: 'CLUB_INVITATION',
        relatedId: invitation.id,
      },
    })
    console.log(
      `  ✓ Created notification for ${invitation.invitedUser.username}`
    )
  }

  console.log('\n✓ All orphaned invitations have been fixed!')
}

// Run the script
fixOrphanedInvitations()
  .then(() => {
    console.log('\nScript completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error running script:', error)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
