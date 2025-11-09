"""LiveKit AI Voice Agent - Tri-State Roofing Receptionist."""
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import noise_cancellation
from app.config import RECEPTIONIST_INSTRUCTIONS

load_dotenv()


class ReceptionistAgent(Agent):
    """AI receptionist agent with custom instructions and personality."""

    def __init__(self) -> None:
        super().__init__(instructions=RECEPTIONIST_INSTRUCTIONS)


async def entrypoint(ctx: agents.JobContext) -> None:
    """
    Main entrypoint for the LiveKit voice agent.

    Configures and starts the agent session with:
    - Silero VAD for voice activity detection
    - Deepgram for speech-to-text
    - GPT-4o-mini for natural language processing
    - Cartesia Sonic-3 for text-to-speech
    """
    session = AgentSession(
        vad="silero",
        stt="deepgram",
        llm="openai/gpt-4o-mini",
        tts="cartesia/sonic-3:a0e99841-438c-4a64-b679-ae501e7d6091",  # Friendly Woman voice
    )

    await session.start(
        room=ctx.room,
        agent=ReceptionistAgent(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the caller warmly, introduce yourself as Ace, and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
