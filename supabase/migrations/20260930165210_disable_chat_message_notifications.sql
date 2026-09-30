begin;

drop trigger if exists chat_messages_create_notification
  on public.chat_messages;

drop function if exists private.notify_chat_message();

commit;
