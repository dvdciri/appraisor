import { NextRequest, NextResponse } from 'next/server'
import { Agent, run, tool, user } from '@openai/agents'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// Define the output schema
const EstimationOutputSchema = z.object({
  items: z.array(z.object({
    category: z.string(),
    item_name: z.string(),
    description: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unit_cost: z.number(),
    total_cost: z.number(),
    notes: z.string()
  })),
  total_cost: z.number(),
  summary: z.string(),
  error: z.string()
})

// Tool to get refurbishment costs
const getRefurbishmentCosts = tool({
  name: 'get_refurbishment_costs',
  description: 'Retrieves UK refurbishment costs reference data for different quality levels, including units of measurement and descriptions. Use this to get accurate pricing for refurbishment work.',
  parameters: z.object({}),
  execute: async () => {
    const filePath = path.join(process.cwd(), 'lib', 'refurbishment-costs.json')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
  },
})

// Define the refurbishment agent with stable policy instructions
const refurbishmentAgent = new Agent({
  name: 'Refurbishment Cost Estimator',
  instructions: `You are a property builder expert in estimating refurbishment costs from property images.
ALWAYS:
- If "include_items" specified: MUST add these items even if not visible in images
- If "exclude_items" specified: MUST NOT include these items even if visible in images  
- User specifications override image analysis
- Use get_refurbishment_costs tool for accurate UK rates, never invent prices, prices are in pounds per unit
- Use "property_details" to inform estimates
- The "summary" should be max 300 characters`,
  outputType: EstimationOutputSchema,
  tools: [getRefurbishmentCosts],
  model: 'gpt-5-2025-08-07',
})

export async function POST(request: NextRequest) {
  try {
    const { images, refurbishmentLevel, itemsToInclude, itemsToExclude, propertyDetails } = await request.json()

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    if (!refurbishmentLevel) {
      return NextResponse.json(
        { error: 'Refurbishment level not provided' },
        { status: 400 }
      )
    }

    // Prepare the user message as compact JSON
    const payload: any = {
      spec_level: refurbishmentLevel,
      include_items: itemsToInclude || undefined,
      exclude_items: itemsToExclude || undefined,
      property_details: propertyDetails || undefined
    }
    const payloadString = JSON.stringify(payload)
    console.log("Payload:", payload);

    const userMessage = user(payloadString)

    // Add images to the message content
    const imageItems = images.map((imageUrl: string) => ({
      type: 'input_image' as const,
      image: imageUrl,
    }))

    // Combine text and images in the message
    userMessage.content = [
      { type: 'input_text' as const, text: payloadString },
      ...imageItems
    ]

    // Run the agent
    const result = await run(refurbishmentAgent, [userMessage])

    // Extract the final output (already parsed by Zod schema)
    const parsedResult = result.finalOutput

    if (!parsedResult) {
      throw new Error('No output from agent')
    }

    // Log token usage
    const usage = result.state._context.usage
    console.log('[Refurbishment Agent] Usage:', usage)

    // Return the result
    return NextResponse.json({
      success: true,
      data: parsedResult
    })

  } catch (error: any) {
    console.error('Error in refurbishment estimation:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to estimate refurbishment costs'
      },
      { status: 500 }
    )
  }
}
