import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.actions';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  const { svix_id, svix_timestamp, svix_signature } = getSvixHeaders(headers());

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, { "svix-id": svix_id, "svix-timestamp": svix_timestamp, "svix-signature": svix_signature }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', { status: 400 });
  }

  // Log the event type and data for debugging
  console.log('Event Type:', evt.type);
  console.log('Event Data:', evt.data);

  try {
    switch (evt.type) {
      case 'user.created':
        return await handleUserCreated(evt.data);
      case 'user.updated':
        return await handleUserUpdated(evt.data);
      case 'user.deleted':
        return await handleUserDeleted(evt.data);
      default:
        return new Response('Event type not handled', { status: 200 });
    }
  } catch (err) {
    console.error('Error handling event:', err);
    return new Response('Error occurred', { status: 500 });
  }
}

function getSvixHeaders(headerPayload: Headers) {
  return {
    svix_id: headerPayload.get("svix-id"),
    svix_timestamp: headerPayload.get("svix-timestamp"),
    svix_signature: headerPayload.get("svix-signature"),
  };
}

async function handleUserCreated(data: any) {
  // Log the full data for debugging
  console.log('User Created Event Data:', data);

  const { id, email_addresses, image_url, first_name, last_name, username } = data;

  // Check and log if id is undefined
  if (!id) {
    console.error('User Created Event: Missing ID');
    return new Response('Error occurred -- missing ID', { status: 400 });
  }

  const user = {
    clerkId: id,
    email: email_addresses[0]?.email_address || '',
    username: username || '',
    firstName: first_name || '',
    lastName: last_name || '',
    photo: image_url || '',
  };

  const newUser = await createUser(user);

  if (newUser) {
    await clerkClient.users.updateUserMetadata(id, {
      publicMetadata: { userId: newUser._id }
    });
  }

  return NextResponse.json({ message: 'OK', user: newUser });
}

async function handleUserUpdated(data: any) {
  // Log the full data for debugging
  console.log('User Updated Event Data:', data);

  const { id, image_url, first_name, last_name, username } = data;

  // Check and log if id is undefined
  if (!id) {
    console.error('User Updated Event: Missing ID');
    return new Response('Error occurred -- missing ID', { status: 400 });
  }

  const user = {
    firstName: first_name || '',
    lastName: last_name || '',
    username: username || '',
    photo: image_url || '',
  };

  const updatedUser = await updateUser(id, user);

  return NextResponse.json({ message: 'OK', user: updatedUser });
}

async function handleUserDeleted(data: any) {
  // Log the full data for debugging
  console.log('User Deleted Event Data:', data);

  const { id } = data;

  // Check and log if id is undefined
  if (!id) {
    console.error('User Deleted Event: Missing ID');
    return new Response('Error occurred -- missing ID', { status: 400 });
  }

  const deletedUser = await deleteUser(id);

  return NextResponse.json({ message: 'OK', user: deletedUser });
}
