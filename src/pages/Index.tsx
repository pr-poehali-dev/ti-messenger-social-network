import { useState, useEffect } from 'react';
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

export default function Index() {
  const [theme, setTheme] = useState<Theme>('gradient');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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

    const mockUser: User = {
      id: 1,
      username: registerForm.username,
      email: registerForm.email,
      avatar_url: 'https://cdn.poehali.dev/files/76768b2e-6f03-4ed5-8c11-5e5cc160bb95.png',
    };

    setCurrentUser(mockUser);
    setIsLoggedIn(true);
    setMessages(mockMessages);
    toast({
      title: 'Добро пожаловать!',
      description: `Аккаунт ${registerForm.username} создан`,
    });
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

    const mockUser: User = {
      id: 1,
      username: 'demo_user',
      email: loginForm.email,
      avatar_url: 'https://cdn.poehali.dev/files/76768b2e-6f03-4ed5-8c11-5e5cc160bb95.png',
    };

    setCurrentUser(mockUser);
    setIsLoggedIn(true);
    setMessages(mockMessages);
    toast({
      title: 'Успешно!',
      description: 'Вы вошли в систему',
    });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() && !editingMessageId) return;

    if (editingMessageId) {
      setMessages(
        messages.map((msg) =>
          msg.id === editingMessageId
            ? { ...msg, content: messageInput, is_edited: true }
            : msg
        )
      );
      setEditingMessageId(null);
      toast({
        title: 'Сообщение изменено',
      });
    } else {
      const newMessage: Message = {
        id: messages.length + 1,
        sender_id: currentUser?.id || 1,
        content: messageInput,
        is_edited: false,
        created_at: new Date().toISOString(),
      };
      setMessages([...messages, newMessage]);
    }

    setMessageInput('');
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setMessageInput(msg.content);
  };

  const handleDeleteMessage = (id: number) => {
    setMessages(messages.filter((msg) => msg.id !== id));
    toast({
      title: 'Сообщение удалено',
    });
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
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-accent"
            >
              <Avatar className="mr-3 h-12 w-12">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=friend1" />
                <AvatarFallback>F1</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium">Друг 1</p>
                <p className="text-sm text-muted-foreground truncate">
                  Привет! Как дела?
                </p>
              </div>
            </Button>
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=friend1" />
              <AvatarFallback>F1</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">Друг 1</h3>
              <p className="text-xs text-muted-foreground">в сети</p>
            </div>
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
