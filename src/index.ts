import * as rlSync from 'readline-sync';

enum TaskPriority {
	Lowest   = 'Muito Baixa',
	Low      = 'Baixa',
	Medium   = 'Média',
	High     = 'Alta',
	Critical = 'Muito Alta'
};

enum TaskStatus {
	Pending   = 'Pendente',
	Completed = 'Completa'
};
	
/* REGEX para capitalizar qualquer palavra de uma string */
function capitalizeWords(str: string): string { return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()); }

class TaskPriorityUtils {
	/* Pergunta por uma prioridade de tarefa ao usuário */
	public static askTaskPriority(message: string): TaskPriority
	{
		let choosen = '';
		let options = ['Muito Baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'];

		message += `(${options.join(', ')}): `;  /* Adiciona as opções válidas e ':' como separador na mensagem de pergunta */

		return capitalizeWords(rlSync.question(
			message, {
				caseSensitive: false, /* Desativa a diferenciação entre maiúsculo e minúsculo */
				limit: options,       /* Torna válido apenas valores corretos para prioridades de tarefa */
				limitMessage: `Por favor, escolha uma prioridade válida.` /* Mensagem para erros */ 
			}
		)) as TaskPriority;
	}
};

class Task {
	public constructor(
		private description: string,
		private priority:    TaskPriority,
		private status:      TaskStatus
	) {}

	public getDescription(): string       { return this.description; }
	public getPriority():    TaskPriority { return this.priority;    }
	public getStatus():      TaskStatus   { return this.status;      }

	public setDescription(description: string):       void { this.description = description; }
	public setPriority(priority:       TaskPriority): void { this.priority    = priority;    }
	public setStatus(status:           TaskStatus):   void { this.status      = status;      }

	public toString(): string {
		return `${this.priority} - ${this.description} - ${this.status}`;
	}
};

class Queue<T> {
	private elements: T[] = [];

	get items()  { return this.elements;                           }
	get length() { return this.elements.length;                    }

	get last()   { return this.elements[this.elements.length - 1]; }
	get first()  { return this.elements[0];                        }
	
	public includes(elem: T): boolean       { return this.elements.includes(elem); } 
	public isEmpty():         boolean       { return this.length === 0;            }
	public peek():            T | undefined { return this.first;                   }
	public dequeue():         T | undefined { return this.elements.shift();        }
	public enqueue(elem: T):  void          { this.elements.push(elem);            }
	public clear():           void          { this.elements = [];                  }
	public reverse():         void          { this.elements.reverse();             }
	public table():           void          { console.table(this.items);           }

	/* Chama forEach para o array */
	public forEach(callback: (elem: T, idx: number) => void): void
	{
		this.elements.forEach(callback);
	}

	public findIndex(predicate: (elem: T) => boolean): number
	{
		return this.elements.findIndex(predicate);
	}
	
	public toString(): string
	{
		return JSON.stringify(this.items);
	}
};

/* Transformando a fila de tipagem génerica Queue<T> em uma fila de class Task
	Nota: `type TaskQueue = Queue<Task>;` Também serviria, mas para implementar novos métodos específicos, isso é melhor.
*/
class TaskQueue extends Queue<Task> {
	/* retorna a próxima tarefa pendente */
	public nextPending(): Task | undefined
	{
		let next = this.peek();
		if (next && next.getStatus() !== TaskStatus.Completed)
			return next; 

		/* Tenta achar o primeiro indíce não concluído */
		return this.items[
			this.findIndex(task =>
				task.getStatus() !== TaskStatus.Completed)
		];
	}
	
	/* retorna a primeira tarefa concluída */
	public nextCompleted(): Task | undefined
	{
		let next = this.peek();
		if (next && next.getStatus() === TaskStatus.Completed)
			return next; 

		/* Tenta achar o primeiro indíce concluído */
		return this.items[
			this.findIndex(task =>
				task.getStatus() === TaskStatus.Completed)
		];
	}

	/* Lista apenas o que estiver pendente */
	public listPending(): void
	{
		/* guarda se uma nota já foi impressa no terminal */
		let hasPrintedOne = false;

		this.forEach(task => {
			if (task.getStatus() !== TaskStatus.Completed) {
				console.table({
					'Descrição':  task.getDescription(),
					'Prioridade': task.getPriority(),
					'Status':     task.getStatus()
				});
				hasPrintedOne = true;
			}
		}); 
		
		if (!hasPrintedOne)
			console.warn('Não há notas concluídas na fila.');
	}

	/* Lista apenas o que não estiver pendente */
	public listCompleted(): void
	{
		let hasPrintedOne = false;

		this.forEach(task => {
			if (task.getStatus() === TaskStatus.Completed) {
				console.table({
					'Descrição':  task.getDescription(),
					'Prioridade': task.getPriority(),
					'Status':     task.getStatus()
				});
				hasPrintedOne = true;
			}
		}); 

		if (!hasPrintedOne)
			console.warn('Não há notas pendentes na fila.');
	}

	/* Lista o que estiver concluído e depois o que estiver pendente */
	public list(): void
	{
		if (this.length === 0) {
			console.warn('Não há notas na fila.');
			return;
		}

		this.listPending();
		this.listCompleted();
	}
};

/* menu principal do programa */
function mainMenu(taskQueue: TaskQueue): void
{
	let option = '';

	do {
		console.clear();
		option = rlSync.question(
			'----------------- TODO LIST ----------------\n' +
			'- 0.  Sair                                 -\n' +
			'- 1.  Adicionar tarefa                     -\n' +
			'- 2.  Marcar próxima tarefa como concluída -\n' +
			'- 3.  Remover primeira tarefa              -\n' +
			'- 4.  Exibir primeira tarefa               -\n' +
			'- 5.  Exibir próxima tarefa                -\n' +
			'- 6.  Listar todas as tarefas              -\n' +
			'- 7.  Listar apenas as tarefas pendentes   -\n' +
			'- 8.  Listar apenas as tarefas concluídas  -\n' +
			'- 9.  Inverter ordem da lista              -\n' +
			'- 10. Limpar lista                         -\n' +
			'----------------- TODO LIST ----------------\n' +
			'Opção selecionada: '
		);

		switch (option) {
		case '0':
			console.clear(); /* limpa a tela e sai do loop */
			continue;
		case '1': { /* abertura de escopo para criar variáveis dentro do case */
			let task = new Task(
				rlSync.question('Descrição da Tarefa: '),
				TaskPriorityUtils.askTaskPriority('Prioridade da Tarefa'),
				TaskStatus.Pending
			);

			try {
				taskQueue.enqueue(task);
				console.info('Operação concluída com sucesso!');
			} catch(e) {
				/* provavelmente falta de memória */
				console.error('Um erro ocorreu:', (e as Error).message);
			}

			break; }
		case '2': { /* abertura de escopo para criar variáveis dentro do case */
			const task = taskQueue.nextPending();
			
			if (task) {
				task.setStatus(TaskStatus.Completed);
				console.info('Operação concluída com sucesso!');
			} else {
				console.warn('Não há tarefas para concluir.');
			}

			break; }
		case '3':
			if (taskQueue.dequeue()) {
				console.info('Operação concluída com sucesso!');
			} else {
				console.warn('Não há tarefas para remover.'); 
			}

			break;
		case '4': {
			let next = taskQueue.peek();
			if (next) {
				console.log(next.toString());
				console.info('Operação concluída com sucesso!');
			} else {
				console.warn('Não há tarefas para remover.'); 
			}

			break; }
		case '5': {
			const task = taskQueue.nextPending();

			if (task) {
				console.log(task.toString());
				console.info('Operação concluída com sucesso!');
			} else {
				console.warn('Não há tarefas para remover.'); 
			}

			break; }
		case '6':
			taskQueue.list();
			break;
		case '7':
			taskQueue.listPending();
			break;
		case '8':
			taskQueue.listCompleted();
			break;
		case '9':
			try {
				taskQueue.reverse();
				console.info('Operação concluída com sucesso!')
			} catch(e) {
				console.error('Um erro ocorreu:', (e as Error).message);
			}

			break;
		case '10':
			try {
				taskQueue.clear();
				console.info('Operação concluída com sucesso!');
			} catch(e) {
				/* dificilmente um erro será jogado por excluir um array */
				console.error('Um erro ocorreu:', (e as Error).message);
			}

			break;
		}

		rlSync.question('Pressione a tecla ENTER para prosseguir...', {hideEchoBack: true, mask: ''});
		console.clear();
	} while (option !== '0');
}

mainMenu(new TaskQueue());
