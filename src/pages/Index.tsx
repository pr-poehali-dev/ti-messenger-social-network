import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Theme = 'gradient' | 'light' | 'dark';

interface Message {
  id: number;
  sender_id: number;
  content: string;
  photo_url?: string;
  is_edited: boolean;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
}

interface Chat {
  id: number;
  contact_name: string;
  contact_avatar: string;
  contact_id: number;
}

export default function Index() {
  const [theme, setTheme] = useState<Theme>('gradient');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [selectedContact, setSelectedContact] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-gradient', 'theme-light', 'dark');
    
    if (theme === 'gradient') {
      root.classList.add('theme-gradient');
    } else if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!currentChatId || !isLoggedIn) return;

    const interval = setInterval(async () => {
      try {
        const msgs = await api.messages.getMessages(currentChatId);
        setMessages(msgs);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentChatId, isLoggedIn]);

  const mockMessages: Message[] = [
    {
      id: 1,
      sender_id: 1,
      content: 'Привет! Как дела?',
      is_edited: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      sender_id: 2,
      content: 'Отлично! Ты уже пробовал Ti Messenger?',
      is_edited: false,
      created_at: new Date().toISOString(),
    },
  ];

  const handleRegister = async () => {
    if (!registerForm.username || !registerForm.email || !registerForm.password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const user = await api.auth.register(
        registerForm.username,
        registerForm.email,
        registerForm.password
      );
      
      setCurrentUser(user);
      setIsLoggedIn(true);
      
      const chat = await api.chats.createChat(user.id, 2);
      setCurrentChatId(chat.id);
      
      const userChats = await api.chats.getChats(user.id);
      setChats(userChats);
      
      toast({
        title: 'Добро пожаловать!',
        description: `Аккаунт ${registerForm.username} создан`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать аккаунт',
        variant: 'destructive',
      });
    }
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const user = await api.auth.login(loginForm.email, loginForm.password);
      
      if (user.error) {
        toast({
          title: 'Ошибка',
          description: 'Неверный email или пароль',
          variant: 'destructive',
        });
        return;
      }
      
      setCurrentUser(user);
      setIsLoggedIn(true);
      
      const userChats = await api.chats.getChats(user.id);
      setChats(userChats);
      
      if (userChats.length > 0) {
        setCurrentChatId(userChats[0].id);
        setSelectedContact(userChats[0]);
        const msgs = await api.messages.getMessages(userChats[0].id);
        setMessages(msgs);
      }
      
      toast({
        title: 'Успешно!',
        description: 'Вы вошли в систему',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось войти',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !editingMessageId) return;
    if (!currentChatId || !currentUser) return;

    try {
      if (editingMessageId) {
        const updatedMsg = await api.messages.editMessage(editingMessageId, messageInput);
        setMessages(
          messages.map((msg) =>
            msg.id === editingMessageId ? updatedMsg : msg
          )
        );
        setEditingMessageId(null);
        toast({
          title: 'Сообщение изменено',
        });
      } else {
        const newMessage = await api.messages.sendMessage(
          currentChatId,
          currentUser.id,
          messageInput
        );
        setMessages([...messages, newMessage]);
      }

      setMessageInput('');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    }
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setMessageInput(msg.content);
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      await api.messages.deleteMessage(id);
      setMessages(messages.filter((msg) => msg.id !== id));
      toast({
        title: 'Сообщение удалено',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить сообщение',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUpload = () => {
    toast({
      title: 'Фото загружено',
      description: 'Функция в разработке',
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 backdrop-blur-sm bg-white/95">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 mb-4 rounded-2xl overflow-hidden">
              <img
                src="https://cdn.poehali.dev/files/76768b2e-6f03-4ed5-8c11-5e5cc160bb95.png"
                alt="Ti Messenger"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Ti Messenger
            </h1>
            <p className="text-muted-foreground mt-2">Общайся с друзьями</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
              />
              <Button onClick={handleLogin} className="w-full">
                Войти
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <Input
                placeholder="Имя пользователя"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, username: e.target.value })
                }
              />
              <Input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
              />
              <Button onClick={handleRegister} className="w-full">
                Создать аккаунт
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={currentUser?.avatar_url} />
              <AvatarFallback>{currentUser?.username?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{currentUser?.username}</h2>
              <p className="text-xs text-muted-foreground">В сети</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Icon name="Settings" size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('gradient')}>
                <Icon name="Sparkles" size={16} className="mr-2" />
                Градиент
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Icon name="Sun" size={16} className="mr-2" />
                Светлая
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Icon name="Moon" size={16} className="mr-2" />
                Тёмная
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsLoggedIn(false)}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start hover:bg-accent"
                onClick={async () => {
                  setCurrentChatId(chat.id);
                  setSelectedContact(chat);
                  const msgs = await api.messages.getMessages(chat.id);
                  setMessages(msgs);
                }}
              >
                <Avatar className="mr-3 h-12 w-12">
                  <AvatarImage src={chat.contact_avatar} />
                  <AvatarFallback>{chat.contact_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium">{chat.contact_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    Нажмите для просмотра
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedContact ? (
              <>
                <Avatar>
                  <AvatarImage src={selectedContact.contact_avatar} />
                  <AvatarFallback>{selectedContact.contact_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedContact.contact_name}</h3>
                  <p className="text-xs text-muted-foreground">в сети</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Выберите чат</p>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender_id === currentUser?.id
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div className="group relative max-w-[70%]">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      msg.sender_id === currentUser?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.photo_url && (
                      <img
                        src={msg.photo_url}
                        alt="Photo"
                        className="rounded-lg mb-2 max-w-xs"
                      />
                    )}
                    <p className="break-words">{msg.content}</p>
                    {msg.is_edited && (
                      <span className="text-xs opacity-70 ml-2">изменено</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 px-2">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {msg.sender_id === currentUser?.id && (
                    <div className="absolute -right-12 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditMessage(msg)}
                      >
                        <Icon name="Pencil" size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteMessage(msg.id)}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePhotoUpload}
              className="shrink-0"
            >
              <Icon name="Image" size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSendMessage}
              className="shrink-0"
            >
              <Icon name="Send" size={20} />
            </Button>
            <Input
              placeholder={
                editingMessageId
                  ? 'Редактирование сообщения...'
                  : 'Введите сообщение...'
              }
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            {editingMessageId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingMessageId(null);
                  setMessageInput('');
                }}
              >
                <Icon name="X" size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}