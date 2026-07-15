import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

type TemplateTaskSeed = {
  title: string
  dayOffset: number
  module:
    | "GENERAL"
    | "HOME"
    | "VEHICLE"
    | "PET"
    | "CHILD"
    | "HEALTH"
    | "SHOPPING"
}

type TemplateSeed = {
  key: string
  name: string
  description: string
  category:
    | "MOVING"
    | "BABY"
    | "NEW_PET"
    | "VACATION"
    | "CHRISTMAS"
    | "BIRTHDAY"
    | "KITCHEN_RENOVATION"
    | "BUY_HOUSE"
    | "BUY_CAR"
  icon: string
  tasks: TemplateTaskSeed[]
}

const TEMPLATES: TemplateSeed[] = [
  {
    key: "moving",
    name: "Me mudo",
    description: "Todo lo que hay que resolver antes y después del día de la mudanza.",
    category: "MOVING",
    icon: "🏡",
    tasks: [
      { title: "Solicitar presupuestos de empresas de mudanza", dayOffset: -30, module: "GENERAL" },
      { title: "Dar de baja/cambiar suministros (luz, agua, gas, internet)", dayOffset: -21, module: "HOME" },
      { title: "Empezar a embalar lo que no usas a diario", dayOffset: -14, module: "HOME" },
      { title: "Notificar el cambio de dirección (banco, trabajo, DGT)", dayOffset: -14, module: "GENERAL" },
      { title: "Reservar ascensor o parking para el camión de mudanza", dayOffset: -7, module: "GENERAL" },
      { title: "Confirmar la empresa de mudanza", dayOffset: -3, module: "GENERAL" },
      { title: "Día de la mudanza", dayOffset: 0, module: "GENERAL" },
      { title: "Dar de alta los suministros en la nueva vivienda", dayOffset: 3, module: "HOME" },
      { title: "Empadronarse en el nuevo domicilio", dayOffset: 7, module: "GENERAL" },
      { title: "Actualizar la dirección en el DNI y el carnet de conducir", dayOffset: 14, module: "GENERAL" },
    ],
  },
  {
    key: "baby",
    name: "Voy a tener un bebé",
    description: "Preparativos antes y después de la fecha prevista de parto.",
    category: "BABY",
    icon: "👶",
    tasks: [
      { title: "Preparar la habitación del bebé", dayOffset: -90, module: "HOME" },
      { title: "Comprar carrito y silla de coche", dayOffset: -60, module: "SHOPPING" },
      { title: "Preparar la maleta del hospital", dayOffset: -45, module: "GENERAL" },
      { title: "Elegir pediatra", dayOffset: -30, module: "HEALTH" },
      { title: "Comprar ropa de recién nacido", dayOffset: -21, module: "SHOPPING" },
      { title: "Instalar la silla de coche", dayOffset: -14, module: "VEHICLE" },
      { title: "Nace el bebé 🎉", dayOffset: 0, module: "CHILD" },
      { title: "Inscribir al bebé en el Registro Civil", dayOffset: 3, module: "GENERAL" },
      { title: "Solicitar el permiso de maternidad/paternidad", dayOffset: 7, module: "GENERAL" },
      { title: "Primera revisión pediátrica", dayOffset: 15, module: "HEALTH" },
      { title: "Solicitar el libro de familia", dayOffset: 30, module: "GENERAL" },
    ],
  },
  {
    key: "new-pet",
    name: "Llega una mascota",
    description: "Todo lo necesario para recibir a un nuevo animal en casa.",
    category: "NEW_PET",
    icon: "🐶",
    tasks: [
      { title: "Comprar cama, comedero y transportín", dayOffset: -7, module: "SHOPPING" },
      { title: "Comprar pienso o comida inicial", dayOffset: -3, module: "SHOPPING" },
      { title: "Llega a casa 🐾", dayOffset: 0, module: "PET" },
      { title: "Primera visita al veterinario", dayOffset: 3, module: "PET" },
      { title: "Poner el chip identificativo", dayOffset: 7, module: "PET" },
      { title: "Contratar el seguro para mascotas", dayOffset: 14, module: "PET" },
      { title: "Apuntarse a clases de adiestramiento", dayOffset: 21, module: "PET" },
      { title: "Desparasitación", dayOffset: 30, module: "PET" },
    ],
  },
  {
    key: "vacation",
    name: "Me voy de vacaciones",
    description: "Que no se te olvide nada antes de salir de viaje.",
    category: "VACATION",
    icon: "🏖️",
    tasks: [
      { title: "Reservar alojamiento y transporte", dayOffset: -30, module: "GENERAL" },
      { title: "Revisar la validez del pasaporte o DNI", dayOffset: -14, module: "GENERAL" },
      { title: "Contratar el seguro de viaje", dayOffset: -7, module: "GENERAL" },
      { title: "Organizar quién cuida de mascotas o plantas", dayOffset: -5, module: "PET" },
      { title: "Hacer las maletas", dayOffset: -3, module: "GENERAL" },
      { title: "Revisar el coche antes del viaje largo", dayOffset: -1, module: "VEHICLE" },
      { title: "Parar el correo o avisar a los vecinos", dayOffset: -1, module: "HOME" },
      { title: "¡Buen viaje! ✈️", dayOffset: 0, module: "GENERAL" },
    ],
  },
  {
    key: "christmas",
    name: "Organizar Navidad",
    description: "Regalos, menú y decoración sin dejarlo todo para el último día.",
    category: "CHRISTMAS",
    icon: "🎄",
    tasks: [
      { title: "Hacer la lista de regalos", dayOffset: -30, module: "SHOPPING" },
      { title: "Reservar mesa o decidir el menú", dayOffset: -21, module: "GENERAL" },
      { title: "Comprar los regalos", dayOffset: -14, module: "SHOPPING" },
      { title: "Decorar la casa", dayOffset: -10, module: "HOME" },
      { title: "Enviar felicitaciones o invitaciones", dayOffset: -7, module: "GENERAL" },
      { title: "Comprar el menú de Nochebuena", dayOffset: -3, module: "SHOPPING" },
      { title: "Envolver los regalos", dayOffset: -1, module: "GENERAL" },
      { title: "🎄 Feliz Navidad", dayOffset: 0, module: "GENERAL" },
    ],
  },
  {
    key: "birthday",
    name: "Preparar un cumpleaños",
    description: "La fiesta lista sin agobios de última hora.",
    category: "BIRTHDAY",
    icon: "🎂",
    tasks: [
      { title: "Decidir fecha y lugar de la fiesta", dayOffset: -21, module: "GENERAL" },
      { title: "Enviar las invitaciones", dayOffset: -14, module: "GENERAL" },
      { title: "Reservar animación o local si hace falta", dayOffset: -10, module: "GENERAL" },
      { title: "Encargar la tarta", dayOffset: -7, module: "SHOPPING" },
      { title: "Comprar la decoración", dayOffset: -5, module: "SHOPPING" },
      { title: "Comprar el regalo", dayOffset: -3, module: "SHOPPING" },
      { title: "Confirmar el número de invitados", dayOffset: -1, module: "GENERAL" },
      { title: "🎂 ¡Feliz cumpleaños!", dayOffset: 0, module: "GENERAL" },
    ],
  },
  {
    key: "kitchen-renovation",
    name: "Reformar la cocina",
    description: "Desde pedir presupuestos hasta la limpieza final de la obra.",
    category: "KITCHEN_RENOVATION",
    icon: "🔨",
    tasks: [
      { title: "Pedir presupuestos a varios reformistas", dayOffset: -60, module: "HOME" },
      { title: "Elegir diseño y materiales", dayOffset: -45, module: "HOME" },
      { title: "Solicitar permisos o licencia de obra si hace falta", dayOffset: -30, module: "HOME" },
      { title: "Encargar los electrodomésticos", dayOffset: -14, module: "SHOPPING" },
      { title: "Vaciar y proteger la cocina actual", dayOffset: -7, module: "HOME" },
      { title: "Organizar una cocina temporal", dayOffset: -3, module: "HOME" },
      { title: "Empieza la obra", dayOffset: 0, module: "HOME" },
      { title: "Revisión de fontanería y electricidad", dayOffset: 30, module: "HOME" },
      { title: "Recepción e instalación de electrodomésticos", dayOffset: 45, module: "HOME" },
      { title: "Fin de obra y limpieza final", dayOffset: 60, module: "HOME" },
    ],
  },
  {
    key: "buy-house",
    name: "Comprar una casa",
    description: "Desde la hipoteca hasta empadronarte en la nueva vivienda.",
    category: "BUY_HOUSE",
    icon: "📦",
    tasks: [
      { title: "Definir presupuesto y solicitar la hipoteca", dayOffset: -90, module: "GENERAL" },
      { title: "Buscar y visitar viviendas", dayOffset: -60, module: "GENERAL" },
      { title: "Hacer la oferta y firmar las arras", dayOffset: -30, module: "GENERAL" },
      { title: "Solicitar la tasación", dayOffset: -21, module: "GENERAL" },
      { title: "Revisar la nota simple registral", dayOffset: -14, module: "GENERAL" },
      { title: "Contratar el seguro de hogar", dayOffset: -7, module: "HOME" },
      { title: "Firma ante notario 🏠", dayOffset: 0, module: "GENERAL" },
      { title: "Dar de alta los suministros", dayOffset: 3, module: "HOME" },
      { title: "Empadronarse en la nueva vivienda", dayOffset: 14, module: "GENERAL" },
      { title: "Registrar la propiedad", dayOffset: 30, module: "GENERAL" },
    ],
  },
  {
    key: "buy-car",
    name: "Comprar coche",
    description: "De comparar ofertas a tener toda la documentación en regla.",
    category: "BUY_CAR",
    icon: "🚗",
    tasks: [
      { title: "Definir presupuesto y tipo de coche", dayOffset: -30, module: "GENERAL" },
      { title: "Comparar concesionarios y ofertas", dayOffset: -21, module: "VEHICLE" },
      { title: "Solicitar financiación si hace falta", dayOffset: -14, module: "GENERAL" },
      { title: "Contratar el seguro del coche", dayOffset: -7, module: "VEHICLE" },
      { title: "Recoger el coche 🚗", dayOffset: 0, module: "VEHICLE" },
      { title: "Tramitar el cambio de titularidad", dayOffset: 3, module: "VEHICLE" },
      { title: "Guardar la documentación (permiso de circulación, ficha técnica)", dayOffset: 7, module: "VEHICLE" },
      { title: "Revisar la fecha de la próxima ITV", dayOffset: 30, module: "VEHICLE" },
    ],
  },
]

async function main() {
  for (const template of TEMPLATES) {
    const record = await db.routineTemplate.upsert({
      where: { key: template.key },
      create: {
        key: template.key,
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
      },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
      },
    })

    // Tasks have no natural unique key of their own — simplest idempotent
    // approach is to replace them wholesale on every seed run.
    await db.routineTemplateTask.deleteMany({ where: { templateId: record.id } })
    await db.routineTemplateTask.createMany({
      data: template.tasks.map((task, index) => ({
        templateId: record.id,
        title: task.title,
        dayOffset: task.dayOffset,
        module: task.module,
        order: index,
      })),
    })

    console.log(`Seeded "${template.name}" (${template.tasks.length} tareas)`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
