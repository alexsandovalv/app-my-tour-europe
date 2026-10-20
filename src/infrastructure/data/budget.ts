import { eur } from '../../domain/money'
import type { BudgetLine } from '../../domain/trip'

/** Presupuesto de los 5 días en Madrid (21 a 26 de nov) para 2 personas, sin comida ni vuelos. */
export const MADRID_BUDGET: readonly BudgetLine[] = [
  { concept: 'Apartamento, 5 noches', price: eur(400, 650) },
  { concept: 'Limpieza y comisiones', price: eur(45, 90) },
  { concept: 'Tour Bernabéu, 2 personas (Classic a guiada)', price: eur(74, 112) },
  { concept: 'Tren a Segovia, ida y vuelta, 2 personas', price: eur(24, 84) },
  { concept: 'Prado, Reina Sofía y Thyssen en horario gratuito', price: eur(0, 0) },
]

export const BERNABEU_PRICES: readonly BudgetLine[] = [
  { concept: 'Classic', price: eur(37) },
  { concept: 'Classic, hora flexible', price: eur(44) },
  { concept: 'Guiada', price: eur(56) },
  { concept: 'Classic + RM Games', price: eur(59) },
]
