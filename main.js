const tasksBacklog = document.querySelector('.tasks-backlog');
const tasksBasket = document.querySelector('.tasks-basket');
const allTasks = document.querySelectorAll('.tasks');
const emptyListBacklog = document.querySelector('.empty-list-backlog');
const emptyListBasket = document.querySelector('.empty-list-basket');
const taskInput = document.querySelector('.input-add-task');
const form = document.querySelector('.form');
const btnDeleteTasks = document.querySelector('.btn-delete-tasks');

let tasks = [];

//Отображаем сохраненные данные в веб-хранилище, находящемся в браузере пользователя
if(localStorage.getItem('tasks')) {
  tasks = JSON.parse(localStorage.getItem('tasks'));

  //Отбор элементов массива для последовательного вывода их на страницу
  let i = 1;
  while(true){
    const elements = tasks.filter(el => el.position === i);
    if(elements.length === 0){
      break;
    }
    elements.forEach((task) => renderTask(task));
    i++;
  }

  for(let task of allTasks) {
    //Скрытие блока, сообщающем о пустоте, если в столбце есть задачи 
    if(task.children.length >= 2){
      const childEmptyList = task.querySelector('.empty-list');
      childEmptyList.classList.add('empty-list--off');
    }
    //Если в столбце Корзина есть задачи, то разблокировать кнопку Очистить
    if(tasksBasket.children.length > 1){
      btnDeleteTasks.disabled = false;
    }
  };

}

//Добавляем обработчики событий
form.addEventListener('submit', addTask);
btnDeleteTasks.addEventListener('click', deleteTasks);

for(let task of allTasks){

  task.addEventListener('click', updateTask);

  task.addEventListener('dragstart', (evt) => evt.target.classList.add('selected'));

  task.addEventListener('dragend', (evt) => {
    saveToLocalStorage();
    evt.target.classList.remove('selected');
  });

  task.addEventListener(`dragover`, dragTask);

};

//Добавление задачи
function addTask(event) {
  //Отмена отправки формы
  event.preventDefault();

  const taskText = taskInput.value;

  //Описание задачи в виде объекта
  const newTask = {
      id: Date.now(),
      text: taskText,
      status: 'backlog',
      position: tasksBacklog.children.length
  }
  
  //Добавление задачи в массив с задачами
  tasks.push(newTask);

  const taskHTML = `<div class="task box-item d-flex justify-content-between align-items-center" id="${newTask.id}" draggable="true">
                      <p class="task-text">${taskText}</p>
                      <form class="form-for-update">
                        <input type="text" class="form-control task-input-update task-input-update--off" pattern="^[^\\s]+(\\s.*)?$" title="Не могут быть пробелы!" required>
                        <button type="button" class="btn btn-update" data-action="update"><i class="fa fa-pencil"></i></button>
                        <button type="submit" class="btn btn-update-save btn--off" data-action="save"><i class="fa fa-check"></i></button>
                      </form>
                    </div>`
  
                        
  //Добавление задачи на страницу                  
  tasksBacklog.insertAdjacentHTML('beforeend', taskHTML);

  taskInput.value = "";
  taskInput.focus();

  //Скрытие блока, сообщающем о пустоте, если он не скрыт
  if(!emptyListBacklog.classList.contains('empty-list--off')) {
    emptyListBacklog.classList.add('empty-list--off');
  }

  saveToLocalStorage();

}


//Очистка корзины
function deleteTasks() {
  //Меняем разметку HTML столбца Корзина
  tasksBasket.innerHTML = `<div class="empty-list empty-list-basket task">
                            <p class="task-text empty-list-text">Корзина пуста</p>
                          </div>`;
  //Отображаем блок, сообщающий о том, что корзина пуста                        
  emptyListBasket.classList.remove('empty-list--off');
  //Блокируем кнопку Очистить
  btnDeleteTasks.disabled = true;
  //Удаляем из массива элементы корзины
  tasks = tasks.filter((task) => task.status !== "basket");

  saveToLocalStorage();
}


//Включение режима редактирования задачи
function updateTask(event) {

  //Определяем, где произошло событие, если не по кнопке редактирования, то выходим из функции
  if(event.target.dataset.action !== 'update') return;

  //Находим ближайшего предка, соответствующего селектору, то есть блок с задачей
  const parentNode = event.target.closest('.task');
  //Запрещаем перетаскивать элемент 
  parentNode.draggable = false;
  //Находим элементы
  const taskInputUpdate = parentNode.querySelector('.task-input-update');
  const taskText = parentNode.querySelector('.task-text');
  const btnUpdateSave = parentNode.querySelector('.btn-update-save');
  const formForUpdate = parentNode.querySelector('.form-for-update');
  //Заменяем содержимое задачи на поле ввода и кнопку с сохранением изменений
  taskInputUpdate.classList.remove('task-input-update--off');
  taskInputUpdate.value = taskText.textContent;
  taskText.classList.add('task-text--off');
  formForUpdate.addEventListener('submit', updateSaveTask)
  event.target.classList.add('btn--off');
  btnUpdateSave.classList.remove('btn--off');
}

//Сохраняем изменения
function updateSaveTask(event) {
  //Отмена отправки формы
  event.preventDefault();
  //Находим ближайшего предка, соответствующего селектору, то есть блок с задачей
  const parentNode = event.target.closest('.task');
  //Разрешаем перетаскивать элемент 
  parentNode.draggable = true;
  //Определяем ID задачи
  const id = Number(parentNode.id);
  //Находим элементы
  const taskInputUpdate = parentNode.querySelector('.task-input-update');
  const taskText = parentNode.querySelector('.task-text');
  const btnUpdate = parentNode.querySelector('.btn-update');
  const btnUpdateSave = parentNode.querySelector('.btn-update-save');
  //Заменяем содержимое задачи на поле ввода и кнопку с сохранением изменений
  taskInputUpdate.classList.add('task-input-update--off');
  taskText.textContent = taskInputUpdate.value;
  taskText.classList.remove('task-text--off');
  btnUpdateSave.classList.add('btn--off');
  btnUpdate.classList.remove('btn--off');
  //Изменяем элемент в массиве с соответствующем id
  const task = tasks.find((task) => task.id === id);
  task.text = taskInputUpdate.value;

  saveToLocalStorage();
}

//Сохраненяем данные в веб-хранилище
function saveToLocalStorage() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}


//Отображаем задачи на странице
function renderTask(task) {

  const taskHTML = `<div class="task box-item d-flex justify-content-between align-items-center" id="${task.id}" draggable="true">
                      <p class="task-text">${task.text}</p>
                      <form class="form-for-update">
                        <input type="text" class="form-control task-input-update task-input-update--off" pattern="^[^\\s]+(\\s.*)?$" title="Не могут быть пробелы!" required>
                        <button type="button" class="btn btn-update" data-action="update"><i class="fa fa-pencil"></i></button>
                        <button type="submit" class="btn btn-update-save btn--off" data-action="save"><i class="fa fa-check"></i></button>
                      </form>
                    </div>`;

  let sectionTask = document.querySelector(`.tasks-${task.status}`);;

  sectionTask.insertAdjacentHTML('beforeend', taskHTML);

}

function dragTask(evt) {
  //Разрешаем сбрасывать элементы в эту область
  evt.preventDefault();
  //Находим перемещаемый элемент
  const activeElement = document.querySelector('.selected');
  //Находим элемент, над которым в данный момент находится курсор
  const currentElement = evt.target;
  //Находим ближайшего предка, соответствующего селектору, то есть столбцы, где находятся эти задачи 
  const parentNodeCurrentEl = currentElement.closest('.tasks');
  const parentNodeActiveEl = activeElement.closest('.tasks');
  //Проверяем, что событие сработало:
  //1. не на том элементе, который мы перемещаем,
  //2. именно на элементе списка
  const isMoveable = activeElement !== currentElement && currentElement.classList.contains(`task`);
  //Если нет, прерываем выполнение функции
  if (!isMoveable) {
    return;
  }
  //evt.clientY — вертикальная координата курсора в момент, когда сработало событие
  const nextElement = getNextElement(evt.clientY, currentElement);
  //Проверяем, нужно ли менять элементы местами. Если не надо, то выходим из функции
  if (nextElement && activeElement === nextElement.previousElementSibling || activeElement === nextElement) {
    return;
  }

  //Вставляем activeElement перед nextElement
  parentNodeCurrentEl.insertBefore(activeElement, nextElement);

  //Определяем нет ли задач в столбце
  if(parentNodeActiveEl.children.length === 1) {
    const childEmptyList = parentNodeActiveEl.querySelector('.empty-list');
    //Показываем блок, сообщающий о пустоте
    childEmptyList.classList.remove('empty-list--off');
    //Если столбец Корзина, то блокируем кнопку 
    if(childEmptyList.classList.contains('empty-list-basket')){
      btnDeleteTasks.disabled = true;
    }
  }
  //Определяем есть ли задачи в столбце
  if(parentNodeCurrentEl.children.length === 2) {
    const childEmptyList = parentNodeCurrentEl.querySelector('.empty-list');
    //Скрываем блок, сообщающий о пустоте
    childEmptyList.classList.add('empty-list--off');
    //Если столбец Корзина, то разблокируем кнопку 
    if(childEmptyList.classList.contains('empty-list-basket')){
      btnDeleteTasks.disabled = false;
    }      
  }

  //Сохранение изменений в массив
  const id = Number(activeElement.id);
  const activeTask = tasks.find((task) => task.id === id);

  for(let task of tasks){
    if(activeTask.status == task.status && activeTask.position < task.position){
      task.position -= 1;
    }
  }
  
  if(parentNodeCurrentEl.classList.contains('tasks-backlog')){
    activeTask.status = 'backlog';
  }
  else if(parentNodeCurrentEl.classList.contains('tasks-process')){
    activeTask.status = 'process';
  }
  else if(parentNodeCurrentEl.classList.contains('tasks-done')){
    activeTask.status = 'done';
  }
  else if(parentNodeCurrentEl.classList.contains('tasks-basket')){
    activeTask.status = 'basket';
  }

  if(nextElement != null && nextElement.id){
    const nextTask = tasks.find(task => task.id === Number(nextElement.id));
    activeTask.position = nextTask.position;
    for(let task of tasks){
      if(task.status == activeTask.status && task.position > nextTask.position){
        task.position += 1;
      }
    }
    nextTask.position += 1;
  } 
  else if(parentNodeCurrentEl.children.length === 2){
    activeTask.position = 1;
  }
  else{
    activeTask.position = parentNodeCurrentEl.children.length - 1;
  }

}

const getNextElement = (cursorPosition, currentElement) => {
  //Получаем объект с размерами и координатами
  const currentElementCoord = currentElement.getBoundingClientRect();
  //Находим вертикальную координату центра текущего элемента
  const currentElementCenter = currentElementCoord.y + currentElementCoord.height / 2;
  //Если курсор выше центра элемента, возвращаем текущий элемент, иначе следующий DOM-элемент
  const nextElement = (cursorPosition < currentElementCenter) ?
    currentElement :
    currentElement.nextElementSibling;
  
  return nextElement;
};